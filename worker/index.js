// The Chronic Health site Worker. Static pages in site/ are served without
// running this code; only /api/* reaches it (run_worker_first in wrangler.jsonc).
//
// POST /api/feedback: the feedback form on the home page. Emails the message to
// FEEDBACK_TO through the EMAIL send_email binding.

const FROM = { email: 'chsitefeedback@jacksoncurtis.me', name: 'Chronic Health site feedback' };
const LIMITS = { name: 100, email: 200, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const reply = (status, body) => Response.json(body, { status });

async function handleFeedback(request, env) {
  if (request.method !== 'POST') return reply(405, { error: 'POST only' });

  // Only this site's own pages may submit.
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return reply(403, { error: 'Wrong origin' });

  let form;
  try {
    form = await request.formData();
  } catch {
    return reply(400, { error: 'Expected a form submission' });
  }
  // Collapse whitespace in the one-line fields so nothing can break a header.
  const line = (key) => String(form.get(key) ?? '').replace(/\s+/g, ' ').trim();
  const name = line('name');
  const email = line('email');
  const kind = line('kind');
  const message = String(form.get('message') ?? '').trim();

  // Bots fill in the hidden "website" field; people never see it. Pretend it
  // worked so they don't retry.
  if (line('website')) return reply(200, { ok: true });

  if (!message) return reply(400, { error: 'Please write a message.' });
  if (email && !EMAIL_RE.test(email)) return reply(400, { error: "That email address doesn't look right." });
  if (name.length > LIMITS.name || email.length > LIMITS.email || message.length > LIMITS.message) {
    return reply(400, { error: 'That is longer than the form allows.' });
  }
  const label = ['Feature request', 'Bug report', 'Question', 'Other'].includes(kind) ? kind : 'Feedback';

  try {
    await env.EMAIL.send({
      from: FROM,
      to: env.FEEDBACK_TO,
      subject: `Chronic Health ${label.toLowerCase()}${name ? ` from ${name}` : ''}`,
      replyTo: email || undefined,
      text: [
        `Type: ${label}`,
        `Name: ${name || '(not given)'}`,
        `Email: ${email || '(not given)'}`,
        '',
        message,
      ].join('\n'),
    });
  } catch (err) {
    console.error('feedback email failed:', err.code, err.message);
    return reply(502, { error: "Sorry, that didn't send. Please email chronic.health.support@gmail.com instead." });
  }
  return reply(200, { ok: true });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/feedback') return handleFeedback(request, env);
    return env.ASSETS.fetch(request);
  },
};
