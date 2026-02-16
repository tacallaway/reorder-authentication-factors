import { createWidget, showSignIn, removeWidget } from './widget.js';

const widget = createWidget();

showSignIn(widget)
  .then((tokens) => {
    // Store tokens in the widget's built-in token manager.
    widget.authClient.tokenManager.setTokens(tokens);

    console.log('Authentication successful. Tokens:', tokens);

    // Swap UI: hide widget, show success message.
    removeWidget(widget);
    document.getElementById('okta-signin-widget-container').style.display = 'none';
    document.getElementById('app-message').style.display = 'block';

    // Wire up sign-out button.
    document.getElementById('logout-btn').addEventListener('click', async () => {
      await widget.authClient.signOut();
      window.location.reload();
    });
  })
  .catch((err) => {
    // OIE widget may throw if the user navigates away or the flow is reset.
    // Only surface unexpected errors.
    if (err.name !== 'CONFIG_ERROR') {
      console.error('Sign-in error:', err);
    }
  });
