const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Le "force dark" d'Android (active par le theme sombre systeme ou l'economiseur de
 * batterie sur Android 10+) peut inverser certaines couleurs de vues natives (dont les
 * TextInput) meme quand une couleur explicite est definie en JS, ce qui rend le texte
 * saisi invisible (blanc sur blanc). On le desactive explicitement au niveau du manifest.
 */
function withDisableForceDark(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:forceDarkAllowed'] = 'false';
    }
    return config;
  });
}

module.exports = withDisableForceDark;
