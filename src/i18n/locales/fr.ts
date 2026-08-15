import type { Messages } from './en'

export const fr: Messages = {
  appName: 'Mailmoss',
  tagline: 'Les expéditeurs que vous ne lisez jamais',
  languageLabel: 'Langue',

  notConnected: 'Pas encore connecté.',
  connectIntro:
    "Mailmoss lit les en-têtes des messages pour déterminer quels expéditeurs vous ignorez. L'accès demandé se limite aux en-têtes : vos emails ne peuvent pas être ouverts.",
  connect: 'Connecter Gmail',
  connecting: 'Connexion…',
  revoke: "Révoquer l'accès",
  revoking: 'Révocation…',
  signedInAs: 'Connecté en tant que {email}',
  messagesTotal: '{count} messages dans ce compte',
  grantedScopes: 'Accordé : {scopes}',

  probeTitle: 'Sonde de permissions',
  probeIntro:
    "Vérifie ce que l'accès aux en-têtes seuls autorise réellement. Le résultat détermine le fonctionnement de l'analyse.",
  probeRun: 'Lancer la sonde',
  probeRunning: 'En cours…',
  probeVerdict: 'Verdict',

  errorTitle: "Quelque chose s'est mal passé",
  retry: 'Réessayer',
}
