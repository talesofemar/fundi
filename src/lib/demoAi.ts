/** Clearly labelled Demo AI helpers — never presented as live API success. */

export const DEMO_AI_LABEL = 'Demo AI mode — sample output. Connect an API key for live results.'

const LG_TO_EN: Record<string, string> = {
  'nnyamba omuntu okuzimba': 'I need someone to build',
  'njagala wardrobe': 'I want a wardrobe',
  "olw'ekwota": 'on Thursday',
  'ssente zange': 'my money',
  'webale': 'thank you',
  'oli otya': 'how are you',
  'nzija enkya': 'I will come tomorrow',
  'wano ku kampala': 'here in Kampala',
  'omulimu guno': 'this job',
  'sente meka': 'how much money',
}

const EN_TO_LG: Record<string, string> = {
  'i need a wardrobe': 'Njagala wardrobe',
  'thank you': 'Webale',
  'how are you': 'Oli otya?',
  'i will come tomorrow': 'Nzija enkya',
  'how much': 'Sente meka?',
  'the job is ready': 'Omulimu gutuukiridde',
  'please wait': 'Nsaba olindirire',
  'delivery on friday': 'Okutuusa ku Lwokutaano',
}

export async function demoTranslate(
  text: string,
  direction: 'lg-en' | 'en-lg',
): Promise<{ transcript: string; translation: string; draft: true }> {
  await delay(700)
  const normalized = text.trim().toLowerCase()
  if (!normalized) {
    return {
      transcript: text,
      translation: '',
      draft: true,
    }
  }

  if (direction === 'lg-en') {
    let out = text
    for (const [lg, en] of Object.entries(LG_TO_EN)) {
      out = out.replace(new RegExp(lg, 'ig'), en)
    }
    if (out.toLowerCase() === normalized) {
      out =
        'Draft translation: The customer is describing a job request. Please review and edit — Demo AI cannot guarantee Luganda accuracy.'
    }
    return { transcript: text, translation: out, draft: true }
  }

  let out = text
  for (const [en, lg] of Object.entries(EN_TO_LG)) {
    out = out.replace(new RegExp(en, 'ig'), lg)
  }
  if (out.toLowerCase() === normalized) {
    out =
      'Olukusa olwa demo: Nsaba okekebera ebigambo bino. (Draft demo translation — please edit.)'
  }
  return { transcript: text, translation: out, draft: true }
}

export async function demoExtractOrder(message: string) {
  await delay(800)
  const lower = message.toLowerCase()
  const customerMatch = message.match(/(?:from|customer|i am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
  return {
    demo: true as const,
    customerName: customerMatch?.[1] ?? '',
    title: lower.includes('wardrobe')
      ? 'Wardrobe request'
      : lower.includes('repair')
        ? 'Repair job'
        : 'Service request',
    description: message.trim(),
    quantity: lower.match(/(\d+)\s*(doors?|desks?|pieces?|items?)/)?.[0] ?? '',
    budget: lower.match(/ugx\s*[\d,]+/i)?.[0] ?? '',
    deadline: lower.includes('friday')
      ? 'Friday (confirm exact date)'
      : lower.includes('tomorrow')
        ? 'Tomorrow (confirm date)'
        : '',
    location: lower.includes('wakiso')
      ? 'Wakiso'
      : lower.includes('kampala')
        ? 'Kampala'
        : '',
    missing: [
      !customerMatch ? 'Customer name' : null,
      !lower.match(/\d/) ? 'Measurements / quantity' : null,
      !lower.includes('when') && !lower.includes('friday') && !lower.includes('deadline')
        ? 'Preferred deadline'
        : null,
      !lower.includes('budget') && !lower.includes('ugx') ? 'Budget if known' : null,
    ].filter(Boolean) as string[],
  }
}

export async function demoQuoteHints(description: string) {
  await delay(600)
  const lower = description.toLowerCase()
  const missing: string[] = []
  if (!lower.match(/\d/)) missing.push('Measurements (height, width, depth)')
  if (!lower.includes('material') && !lower.includes('wood') && !lower.includes('timber'))
    missing.push('Preferred materials')
  if (!lower.includes('when') && !lower.includes('deadline') && !lower.includes('days'))
    missing.push('Expected completion time')
  if (!lower.includes('finish') && !lower.includes('polish') && !lower.includes('paint'))
    missing.push('Finish type (paint, varnish, polish)')

  return {
    demo: true as const,
    summary: description.trim() || 'No description yet',
    suggestedTrade: lower.includes('wire') || lower.includes('socket')
      ? 'Electrician'
      : lower.includes('pipe') || lower.includes('plumb')
        ? 'Plumber'
        : lower.includes('dress') || lower.includes('tailor')
          ? 'Tailor'
          : 'Carpenter',
    missing,
    marginSuggestion: 10,
    note: 'Suggested margin is editable. Enter your own material and labour costs — Demo AI does not invent market prices.',
  }
}

export async function demoPortfolioCopy(notes: string) {
  await delay(500)
  return {
    demo: true as const,
    title: notes.slice(0, 48) || 'Completed project',
    description: notes.trim()
      ? `${notes.trim().replace(/\s+/g, ' ')} Completed with care for a local client. Photos show the finished result.`
      : 'Describe the work you completed, then refine this draft.',
  }
}

export async function demoAssistantReply(prompt: string, context: string) {
  await delay(700)
  const p = prompt.toLowerCase()
  if (p.includes('quotation') || p.includes('quote') || p.includes('wardrobe')) {
    return {
      demo: true as const,
      reply:
        'For a three-door wardrobe quote: ask for height, width, depth, wood type, number of drawers, and delivery area. Enter your own timber, fittings, labour, and transport costs in UGX. Add an optional margin only after your costs are filled. Then preview and share.',
      actions: ['Open quotation builder'],
    }
  }
  if (p.includes('order') || p.includes('message')) {
    return {
      demo: true as const,
      reply:
        'Paste the customer message into My Work → New order. Demo AI will suggest extracted fields. Confirm every field before saving — nothing is saved automatically.',
      actions: ['Create order from message'],
    }
  }
  if (p.includes('translat') || p.includes('luganda')) {
    return {
      demo: true as const,
      reply:
        'Open Voice Bridge, choose Luganda → English or English → Luganda, then type or record. Always review the draft translation before sharing.',
      actions: ['Open Voice Bridge'],
    }
  }
  if (p.includes('delay') || p.includes('polite')) {
    return {
      demo: true as const,
      reply:
        'Draft message: "Hello, thank you for your patience. The work needs two more days because materials arrived late. I will deliver on [date]. Please reply if that time still works for you." Edit before sending.',
      actions: ['Copy draft'],
    }
  }
  if (p.includes('portfolio') || p.includes('project')) {
    return {
      demo: true as const,
      reply:
        'Write rough notes about the job, then use “Improve description” on the portfolio form. Approve the text before publishing to your public profile.',
      actions: ['Add portfolio project'],
    }
  }
  if (p.includes('ask') || p.includes('accept') || p.includes('building')) {
    return {
      demo: true as const,
      reply:
        'Before accepting a building job, confirm: site access, scope of work, who buys materials, payment schedule, start date, and what is excluded. Put agreements in a quotation.',
      actions: ['Create quotation'],
    }
  }
  return {
    demo: true as const,
    reply: `I can help with quotations, orders, Voice Bridge, polite replies, and portfolio wording. You are currently in: ${context}. What would you like to do?`,
    actions: ['Create quotation', 'Open Voice Bridge'],
  }
}

export const SAMPLE_VOICE_DEMO = {
  luganda:
    'Njagala omuntu okukola wardrobe ey’emiryango esatu n’emmeeza. Ndi mu Wakiso. Webale.',
  english:
    'I want someone to make a three-door wardrobe and a table. I am in Wakiso. Thank you.',
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
