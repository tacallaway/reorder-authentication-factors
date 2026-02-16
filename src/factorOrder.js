/**
 * Developer-configurable authentication factor ordering.
 *
 * List authenticator keys in the order you want them presented.
 * Any authenticator returned by the server that is NOT in this list
 * will appear after the listed ones, in its original server order.
 *
 * Common authenticator keys:
 *   okta_password, okta_email, phone_number, okta_verify,
 *   google_otp, security_question, webauthn, duo
 */
export const FACTOR_ORDER = [
  'okta_email',
  'okta_password',
  'phone_number',
  'okta_verify',
  'google_otp',
  'security_question',
];

/**
 * Reorders authenticator DOM elements inside the widget to match FACTOR_ORDER.
 *
 * The widget renders each authenticator option as a
 * `[data-se="authenticator-row"]` element whose inner button carries a
 * `data-se` attribute like `"select-authenticator--okta_email"`.
 *
 * This function is designed to be called from a widget `after` hook on the
 * `select-authenticator-authenticate` or `select-authenticator-enroll` view.
 */
export function reorderAuthenticators() {
  const container = document.querySelector('[data-se="authenticator-list"]')
    ?? document.querySelector('.authenticator-list');

  if (!container) {
    return;
  }

  const rows = Array.from(
    container.querySelectorAll('[data-se="authenticator-row"]')
  );

  if (rows.length === 0) {
    return;
  }

  // Build a priority map: key -> index. Lower index = higher priority.
  const priority = new Map(FACTOR_ORDER.map((key, i) => [key, i]));

  // Determine each row's authenticator key from its inner select button.
  const keyed = rows.map((row) => {
    const btn = row.querySelector('[data-se^="select-authenticator--"]');
    const key = btn
      ? btn.getAttribute('data-se').replace('select-authenticator--', '')
      : null;
    return { row, key };
  });

  // Sort: known keys by FACTOR_ORDER position; unknown keys keep their
  // original relative order after all known ones.
  const fallback = FACTOR_ORDER.length;
  keyed.sort((a, b) => {
    const pa = a.key !== null && priority.has(a.key) ? priority.get(a.key) : fallback;
    const pb = b.key !== null && priority.has(b.key) ? priority.get(b.key) : fallback;
    return pa - pb;
  });

  // Re-append in the desired order (moves existing DOM nodes).
  for (const { row } of keyed) {
    container.appendChild(row);
  }
}
