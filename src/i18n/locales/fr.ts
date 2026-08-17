import type { Messages } from './en'

export const fr: Messages = {
  appName: 'Mailmoss',
  tagline: 'Les expéditeurs que vous ne lisez jamais',
  languageLabel: 'Langue',

  connectIntro:
    "Mailmoss lit les en-têtes des messages pour déterminer quels expéditeurs vous ignorez. L'accès demandé se limite aux en-têtes : vos emails ne peuvent pas être ouverts.",
  connectPrivacy: 'Rien ne part ailleurs que chez Google. Tout est calculé dans ce navigateur.',
  connect: 'Connecter Gmail',
  connecting: 'Connexion…',
  connectOther: 'Utiliser un autre compte',
  switchAccount: 'Changer de compte',
  switchAccountNote:
    "Connecte un autre compte Gmail. L'analyse actuelle est conservée à part et n'est pas mélangée.",

  signedInAs: 'Connecté en tant que {email}',
  messagesTotal: '{count} messages dans ce compte',
  grantedScopes: 'Accordé : {scopes}',

  scanStart: 'Analyser ma boîte',
  scanAgain: 'Relancer une analyse',
  scanning: 'Analyse en cours',
  scanCancel: 'Annuler',
  scanResume: 'Reprendre',
  scanProgress: '{processed} messages · {senders} expéditeurs',
  scanRate: '{rate} par seconde',
  scanCategory: 'Lecture de {label}',
  scanRefresh: 'Voir les nouveaux',
  scanRefreshing: 'Vérification…',
  refreshUpdated: '{count} nouveaux messages ajoutés.',
  refreshUpToDate: 'Rien de nouveau depuis la dernière analyse.',
  refreshBaseline:
    "Cette analyse est antérieure au suivi des nouveautés : il n'y avait rien à comparer. Le suivi démarre maintenant — revenez plus tard pour voir ce qui arrive.",
  refreshTooOld:
    "Trop de temps a passé depuis la dernière analyse pour une simple vérification. Gmail ne conserve qu'environ une semaine d'historique : relancez une analyse complète pour rattraper.",
  scanRestored: 'Analyse précédente récupérée.',
  scanCancelled: "Annulé. Reprendre repart d'où l'analyse s'est arrêtée.",
  scanFinished: '{processed} messages analysés, {senders} expéditeurs trouvés.',
  scanCapped: 'Arrêté à la limite de sécurité de {processed} messages.',
  scanOrderWarning:
    "Gmail a renvoyé les messages dans le désordre : la limite d'un an n'a pas pu s'appliquer. L'analyse a tout parcouru, ce qui a pris plus de temps.",

  resultsEmpty:
    "Aucun expéditeur pour l'instant. Lancez une analyse pour voir qui vous ne lisez jamais.",
  resultsNoMatches: 'Aucun expéditeur ne correspond à ce filtre.',
  resultsClearFilters: 'Effacer les filtres',
  resultsCount: '{count} expéditeurs',
  resultsHandled: '{count} traités',

  filterAll: 'Tous',
  filterNeverOpened: 'Jamais ouverts',
  filterMostlyUnread: 'Plus de 80 % non lus',
  filterDormant: 'Silencieux 6 mois',

  sortLabel: 'Trier',
  sortIgnored: 'Les plus ignorés',
  sortVolume: 'Le plus de messages',
  sortRecent: 'Les plus récents',

  searchPlaceholder: 'Rechercher un expéditeur ou un domaine',

  rowUnread: '{percent} % non lus',
  rowMessages: '{count} messages',
  rowEngaged: 'Vous avez déjà mis en favori ou répondu',

  methodOneClick: 'Un clic',
  methodLink: 'Lien',
  methodEmail: 'Email',
  methodNone: 'Aucun lien',

  selectionCount: '{count} sélectionnés',
  selectionAll: 'Tout sélectionner',
  selectionClear: 'Effacer',
  selectionUnsubscribe: 'Se désabonner',
  selectionIgnore: 'Ignorer',
  selectionLarge: 'Cela fait {count} expéditeurs d’un coup. Vérifiez la liste avant de continuer.',
  unsubscribeNotReady: 'Le désabonnement arrive à la prochaine étape.',

  settings: 'Réglages',
  settingsScope: 'Accès accordé : {scopes}',
  settingsFullScan: "Remonter au-delà d'un an",
  settingsFullScanNote:
    'Plus lent, et change rarement le classement. Newsletters et notifications sont couvertes dans les deux cas.',
  settingsShowHandled: 'Afficher les expéditeurs déjà traités',
  settingsDiagnostics: 'Diagnostics développeur',
  settingsWipe: "Révoquer l'accès et effacer les données locales",
  settingsWipeNote:
    "Retire l'autorisation d'accès et supprime tout ce qui est stocké dans ce navigateur.",
  settingsStorage: 'Stocké localement : {size}',

  confirmTitle: 'Se désabonner de {count} expéditeurs',
  confirmIntro:
    "Toutes les adresses ci-dessous seront désabonnées. Les expéditeurs compatibles en un clic sont traités immédiatement ; les autres s'ouvrent dans un onglet à finir vous-même.",
  confirmMethodSummary: '{oneClick} en un clic · {manual} via un onglet',
  confirmCancel: 'Retour',
  confirmGo: 'Se désabonner',

  hostAccessTitle: 'Une permission supplémentaire',
  hostAccessExplain:
    "Envoyer la requête en un clic nécessite l'autorisation de joindre les serveurs des expéditeurs. Mailmoss la demande maintenant plutôt qu'à l'installation, et ne s'en sert qu'au moment du désabonnement. Refuser fonctionne aussi : ces expéditeurs s'ouvriront simplement dans un onglet.",

  runProgress: 'Désabonnement {index} sur {total}',
  runCancel: 'Arrêter',

  reportTitle: 'Terminé',
  reportDone: '{count} désabonnés',
  reportManual: '{count} ouverts dans un onglet à finir',
  reportFailed: '{count} en échec',
  reportCancelled: "Arrêté en cours. Les expéditeurs non traités n'ont pas été touchés.",
  reportRetry: 'Réessayer les échecs',
  reportClose: 'Fermer',

  statusDone: 'Désabonné',
  statusManual: 'À confirmer',
  statusFailed: 'Échec',

  themeLabel: 'Thème',
  themeSystem: 'Suivre le navigateur',
  themeLight: 'Clair',
  themeDark: 'Sombre',

  errorTitle: "Quelque chose s'est mal passé",
  errorAuth: 'La connexion a expiré. Reconnectez-vous pour continuer.',
  errorNetwork: 'Gmail est injoignable. Vérifiez votre connexion.',
  errorRate: 'Gmail limite le débit. Patienter un instant suffit généralement.',
  retry: 'Réessayer',
  back: 'Retour',
}
