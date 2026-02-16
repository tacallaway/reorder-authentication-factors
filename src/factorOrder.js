/**
 * Developer-configurable authentication factor ordering.
 *
 * List authenticator identifiers in the order you want them presented.
 * Each entry is matched against the `data-se` attribute the widget places
 * on the `.authenticator-button` div inside each authenticator row.
 *
 * The widget builds that attribute as:
 *   {authenticatorKey}              — e.g. "okta_email", "okta_password"
 *   {authenticatorKey}-{methodType} — e.g. "okta_verify-push", "okta_verify-totp"
 *
 * Matching is done with `startsWith` so you can use either the full
 * key-method pair (for method-level ordering) or just the authenticator
 * key (to match all methods of that authenticator as a group).
 *
 * Any authenticator not matched by an entry falls to the end, preserving
 * its original server order.
 *
 * Common identifiers:
 *   okta_password, okta_email, phone_number, security_question,
 *   okta_verify-push, okta_verify-totp, okta_verify-signed_nonce,
 *   google_otp, webauthn, duo, onprem_mfa, rsa_token
 */
export const FACTOR_ORDER = [
  'okta_verify-push',
  'okta_verify-totp',
];

/**
 * Reorders authenticator DOM elements inside the widget to match FACTOR_ORDER.
 *
 * Each authenticator row (.authenticator-row) contains a `.authenticator-button`
 * div whose `data-se` attribute identifies the authenticator (and optionally its
 * method type).  This function sorts the rows so they appear in FACTOR_ORDER.
 *
 * Designed to be called from a widget `after` hook on the
 * `select-authenticator-authenticate` or `select-authenticator-enroll` views.
 */
export function reorderAuthenticators() {
  const container = document.querySelector('.authenticator-list');

  if (!container) {
    return;
  }

  const rows = Array.from(container.querySelectorAll('.authenticator-row'));

  if (rows.length === 0) {
    return;
  }

  // Build a priority map: entry -> index.  Lower index = higher priority.
  const priority = new Map(FACTOR_ORDER.map((key, i) => [key, i]));

  // Extract the identifier for each row from its inner .authenticator-button.
  const keyed = rows.map((row) => {
    const btn = row.querySelector('.authenticator-button[data-se]');
    const id = btn ? btn.getAttribute('data-se') : null;
    return { row, id };
  });

  // Resolve a row's priority.  Try an exact match first; then fall back to
  // prefix matching so that e.g. "okta_verify" in the order list will match
  // a row whose id is "okta_verify-push".
  const resolve = (id) => {
    if (id === null) {
      return FACTOR_ORDER.length;
    }
    if (priority.has(id)) {
      return priority.get(id);
    }
    for (const [entry, idx] of priority) {
      if (id.startsWith(entry)) {
        return idx;
      }
    }
    return FACTOR_ORDER.length;
  };

  // Sort: matched entries by FACTOR_ORDER position; unmatched entries keep
  // their original relative order after all matched ones.
  keyed.sort((a, b) => resolve(a.id) - resolve(b.id));

  // Re-append in the desired order (moves existing DOM nodes without
  // creating or destroying elements).
  const target = container.querySelector('.list-content') ?? container;
  for (const { row } of keyed) {
    target.appendChild(row);
  }
}
