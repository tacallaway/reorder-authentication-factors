/**
 * Developer-configurable authentication factor ordering with section groups.
 *
 * FACTOR_GROUPS is an array of sections. Each section has:
 *   - label:   text displayed as a heading above the group
 *   - factors: ordered array of authenticator identifiers in this group
 *
 * Each identifier is matched against the `data-se` attribute the widget places
 * on the `.authenticator-button` div inside each `.authenticator-row`.
 *
 * The widget builds that attribute as:
 *   {authenticatorKey}              — e.g. "okta_email", "okta_password"
 *   {authenticatorKey}-{methodType} — e.g. "okta_verify-push", "okta_verify-totp"
 *
 * Matching supports both exact match and prefix match so you can target at
 * the authenticator level (e.g. "okta_verify") or the method level
 * (e.g. "okta_verify-push").
 *
 * Any authenticator not matched by any group falls to the end in its original
 * server order, under an "Other options" heading (if there are any).
 *
 * Common identifiers:
 *   okta_password, okta_email, phone_number, security_question,
 *   okta_verify-push, okta_verify-totp, okta_verify-signed_nonce,
 *   google_otp, webauthn, duo, onprem_mfa, rsa_token
 */
export const FACTOR_GROUPS = [
  {
    label: 'Recommended',
    factors: ['okta_verify-push'],
  },
  {
    label: 'Other options',
    factors: ['okta_verify-totp'],
  },
];

// CSS class used on injected elements so we can clean them up on re-render
// without affecting the widget's own DOM.
const INJECTED_CLASS = 'factor-reorder-injected';

/**
 * Resolve which group index (and inner position) a given authenticator id
 * belongs to.  Returns { group, position } or null if unmatched.
 */
function resolveGroup(id, groupMap) {
  if (id === null) {
    return null;
  }
  if (groupMap.has(id)) {
    return groupMap.get(id);
  }
  for (const [entry, loc] of groupMap) {
    if (id.startsWith(entry)) {
      return loc;
    }
  }
  return null;
}

/**
 * Reorders authenticator DOM elements and injects section headings.
 *
 * Designed to be called from a widget `after` hook on the
 * `select-authenticator-authenticate` or `select-authenticator-enroll` views.
 */
export function reorderAuthenticators() {
  const container = document.querySelector('.authenticator-list');
  if (!container) {
    return;
  }

  const target = container.querySelector('.list-content') ?? container;

  // Remove any previously injected headings/dividers (idempotency).
  target.querySelectorAll(`.${INJECTED_CLASS}`).forEach((el) => el.remove());

  const rows = Array.from(target.querySelectorAll('.authenticator-row'));
  if (rows.length === 0) {
    return;
  }

  // Build a lookup: identifier -> { group index, position within group }.
  const groupMap = new Map();
  FACTOR_GROUPS.forEach((section, gi) => {
    section.factors.forEach((key, fi) => {
      groupMap.set(key, { group: gi, position: fi });
    });
  });

  // Tag each row with its group assignment.
  const tagged = rows.map((row) => {
    const btn = row.querySelector('.authenticator-button[data-se]');
    const id = btn ? btn.getAttribute('data-se') : null;
    const loc = resolveGroup(id, groupMap);
    return {
      row,
      group: loc ? loc.group : FACTOR_GROUPS.length,   // unmatched -> last
      position: loc ? loc.position : Infinity,
    };
  });

  // Sort by group first, then by position within group.
  tagged.sort((a, b) => a.group - b.group || a.position - b.position);

  // Re-append rows in order, injecting section headings at group boundaries.
  let currentGroup = -1;
  for (const { row, group } of tagged) {
    if (group !== currentGroup) {
      currentGroup = group;
      const section = FACTOR_GROUPS[group];
      const label = section ? section.label : 'Other options';
      target.appendChild(createSectionHeading(label, group > 0));
    }
    target.appendChild(row);
  }
}

/**
 * Creates a section heading element (with optional divider above it).
 */
function createSectionHeading(text, withDivider) {
  const wrapper = document.createElement('div');
  wrapper.className = INJECTED_CLASS;

  if (withDivider) {
    const hr = document.createElement('hr');
    hr.className = 'factor-reorder-divider';
    wrapper.appendChild(hr);
  }

  const heading = document.createElement('h3');
  heading.className = 'factor-reorder-heading';
  heading.textContent = text;
  wrapper.appendChild(heading);

  return wrapper;
}
