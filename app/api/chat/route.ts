import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/utils/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_employee',
      description: 'Create a new employee in the HR system. Only full_name and email are required.',
      parameters: {
        type: 'object',
        properties: {
          full_name: { type: 'string', description: "Employee's full name" },
          email: { type: 'string', description: "Employee's email address" },
          phone: { type: 'string', description: "Phone number" },
          job_title: { type: 'string', description: 'Job title' },
          department: { type: 'string', description: 'Department' },
          employment_type: {
            type: 'string',
            enum: ['full-time', 'part-time', 'contract', 'intern'],
            description: 'Employment type',
          },
          joining_date: { type: 'string', description: 'Joining date in YYYY-MM-DD format' },
          manager_name: { type: 'string', description: 'Manager name' },
          work_location: { type: 'string', description: 'Work location (city)' },
        },
        required: ['full_name', 'email'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_employees',
      description: 'List employees in the system. Can filter by status (active/inactive/all).',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'all'],
            description: 'Filter by status (default: all)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_employee',
      description: 'Find an employee by name or email. Returns full employee details including ID. Use this before any update/deactivate operation.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: "Name or email to search for (partial match supported)" },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_employee',
      description: 'Update an existing employee. You MUST first use find_employee to get the employee ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: "Employee's UUID (obtained from find_employee)" },
          full_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          job_title: { type: 'string' },
          department: { type: 'string' },
          employment_type: {
            type: 'string',
            enum: ['full-time', 'part-time', 'contract', 'intern'],
          },
          joining_date: { type: 'string' },
          manager_name: { type: 'string' },
          work_location: { type: 'string' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deactivate_employee',
      description: 'Deactivate an employee (set status to inactive). Must find employee first to get ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: "Employee's UUID" },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'activate_employee',
      description: 'Re-activate a deactivated employee. Must find employee first to get ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: "Employee's UUID" },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_employee_summary',
      description: 'Generate a professional HR-style summary for an employee and save it to their profile. Must find employee first.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: "Employee's UUID" },
        },
        required: ['id'],
      },
    },
  },
]

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string | undefined
) {
  switch (toolName) {
    case 'create_employee': {
      const data = {
        full_name: args.full_name,
        email: args.email,
        phone: args.phone ?? null,
        job_title: args.job_title ?? null,
        department: args.department ?? null,
        employment_type: args.employment_type ?? 'full-time',
        joining_date: args.joining_date ?? null,
        manager_name: args.manager_name ?? null,
        work_location: args.work_location ?? null,
        status: 'active',
        created_by: userId,
      }
      const { data: result, error } = await supabase
        .from('employees')
        .insert(data)
        .select()
        .single()
      if (error) return { error: error.message }
      return { success: true, employee: result }
    }

    case 'list_employees': {
      let query = supabase.from('employees').select('*').order('full_name')
      if (args.status && args.status !== 'all') {
        query = query.eq('status', args.status as string)
      }
      const { data, error } = await query
      if (error) return { error: error.message }
      return { employees: data, count: data?.length ?? 0 }
    }

    case 'find_employee': {
      const q = args.query as string
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      if (error) return { error: error.message }
      if (!data || data.length === 0) {
        return { error: `No employee found matching "${q}".` }
      }
      if (data.length > 1) {
        return {
          matches: data.map((e) => ({ id: e.id, full_name: e.full_name, email: e.email })),
          message: 'Multiple matches found. Please be more specific or pick one by name.',
        }
      }
      return { employee: data[0] }
    }

    case 'update_employee': {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }
      const fields = [
        'full_name', 'email', 'phone', 'job_title', 'department',
        'employment_type', 'joining_date', 'manager_name', 'work_location',
      ]
      fields.forEach((f) => {
        if (args[f] !== undefined) updateData[f] = args[f]
      })
      const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', args.id as string)
        .select()
        .single()
      if (error) return { error: error.message }
      return { success: true, employee: data }
    }

    case 'deactivate_employee': {
      const { data, error } = await supabase
        .from('employees')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', args.id as string)
        .select()
        .single()
      if (error) return { error: error.message }
      return { success: true, employee: data }
    }

    case 'activate_employee': {
      const { data, error } = await supabase
        .from('employees')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', args.id as string)
        .select()
        .single()
      if (error) return { error: error.message }
      return { success: true, employee: data }
    }

    case 'generate_employee_summary': {
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', args.id as string)
        .single()
      if (error || !employee) return { error: 'Employee not found' }

      const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an HR assistant. Generate a brief, professional 2-3 sentence summary of an employee based on their details. Be concise, factual, and professional. Do not mention missing fields.',
          },
          {
            role: 'user',
            content: `Generate a summary for this employee:\n${JSON.stringify(employee, null, 2)}`,
          },
        ],
      })

      const summary = summaryResponse.choices[0].message.content ?? ''

      await supabase
        .from('employees')
        .update({ summary, updated_at: new Date().toISOString() })
        .eq('id', args.id as string)

      return { success: true, summary, employee: { ...employee, summary } }
    }

    default:
      return { error: 'Unknown tool' }
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages } = await request.json()

  const systemPrompt = `You are an AI HR Assistant for the Mini AI HR system. You help HR admins manage employee records through natural language.

You have access to tools for:
- Creating new employees
- Listing employees (with optional active/inactive filter)
- Finding employees by name or email
- Updating employee details
- Deactivating/activating employees
- Generating professional HR summaries

IMPORTANT GUIDELINES:
- For update, deactivate, activate, or summary actions, ALWAYS use find_employee first to get the employee ID.
- If required info is missing (e.g. creating an employee without a name or email), ASK the user for it rather than guessing.
- Be friendly, concise, and professional.
- After performing an action, briefly confirm what you did.
- For dates, use YYYY-MM-DD format.
- When listing employees, present them as a clean markdown list with bullet points.
- Use markdown formatting: **bold** for names, bullet points for lists, line breaks between sections.
- Keep responses well-organized and easy to scan.

Current HR admin: ${user.email}
Today's date: ${new Date().toISOString().split('T')[0]}`

  const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  const maxIterations = 5
  for (let i = 0; i < maxIterations; i++) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      tools,
      tool_choice: 'auto',
    })

    const message = completion.choices[0].message
    chatMessages.push(message)

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return NextResponse.json({ message: message.content })
    }

    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== 'function') continue
      const args = JSON.parse(toolCall.function.arguments)
      const result = await executeTool(toolCall.function.name, args, supabase, user.id)
      chatMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      })
    }
  }

  return NextResponse.json({
    message: "I'm having trouble completing that — could you try rephrasing?",
  })
}