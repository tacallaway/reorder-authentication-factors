import OktaSignIn from '@okta/okta-signin-widget';
import '@okta/okta-signin-widget/css/okta-sign-in.min.css';
import { oktaConfig } from './config.js';
import { reorderAuthenticators } from './factorOrder.js';

/**
 * Creates and returns a configured OktaSignIn widget instance (Gen2, v7.x).
 */
export function createWidget() {
  const widget = new OktaSignIn({
    el: '#okta-signin-widget-container',
    issuer: oktaConfig.issuer,
    clientId: oktaConfig.clientId,
    redirectUri: oktaConfig.redirectUri,
    scopes: oktaConfig.scopes,
    // OIE is the default in v7; explicitly do NOT set useClassicEngine.
    authParams: {
      issuer: oktaConfig.issuer,
      scopes: oktaConfig.scopes,
    },
    hooks: {
      'select-authenticator-authenticate': {
        after: [reorderAuthenticators],
      },
      'select-authenticator-enroll': {
        after: [reorderAuthenticators],
      },
    },
  });

  return widget;
}

/**
 * Renders the widget and resolves with tokens on successful sign-in.
 */
export function showSignIn(widget) {
  return widget.showSignInToGetTokens();
}

/**
 * Tears down the widget (removes DOM and event listeners).
 */
export function removeWidget(widget) {
  widget.remove();
}
