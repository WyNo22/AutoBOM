export const metadata = {
  title: "Politique de confidentialité — AutoBOM",
  description: "Politique de confidentialité de l'application et de l'extension Chrome AutoBOM.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold tracking-tight mb-2">Politique de confidentialité</h1>
      <p className="text-muted-foreground mb-10">Dernière mise à jour : mai 2025</p>

      <section className="space-y-10">

        <div>
          <h2 className="text-base font-semibold mb-3">1. Qui sommes-nous ?</h2>
          <p className="text-muted-foreground">
            AutoBOM est une application web et une extension Chrome dédiées à la gestion de nomenclatures
            (BOM — Bill of Materials) pour les professionnels de l'industrie, de l'électronique et du
            prototypage. AutoBOM est édité et exploité par son équipe de développement.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">2. Données collectées</h2>
          <p className="text-muted-foreground mb-3">
            AutoBOM collecte uniquement les données strictement nécessaires à son fonctionnement :
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Données de compte :</strong> adresse e-mail, prénom,
              nom, mot de passe haché (jamais en clair), date de création du compte.
            </li>
            <li>
              <strong className="text-foreground">Données de BOM :</strong> les nomenclatures, lignes de
              composants, fournisseurs, prix et fichiers joints que vous créez volontairement sur la
              plateforme.
            </li>
            <li>
              <strong className="text-foreground">Données de l'extension Chrome :</strong> lorsque vous
              utilisez l'extension sur une fiche produit d'un site fournisseur, l'extension lit les
              données produits visibles sur la page (désignation, prix, référence) et les envoie vers
              votre compte AutoBOM. Ces données sont du contenu public des sites fournisseurs.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">3. Ce que nous ne collectons pas</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Nous ne collectons pas votre historique de navigation.</li>
            <li>Nous n'enregistrons pas vos mots de passe en clair.</li>
            <li>Nous ne lisons pas vos e-mails, SMS ou messages privés.</li>
            <li>Nous ne collectons pas vos données de localisation GPS.</li>
            <li>Nous ne profilons pas vos habitudes de navigation.</li>
            <li>
              L'extension Chrome ne lit aucune donnée sur les sites que vous visitez en dehors des
              domaines fournisseurs explicitement déclarés dans ses permissions.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">4. Utilisation des données</h2>
          <p className="text-muted-foreground">
            Les données collectées sont utilisées exclusivement pour :
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground mt-3">
            <li>Créer et gérer votre compte utilisateur.</li>
            <li>Stocker et afficher vos nomenclatures et projets.</li>
            <li>Permettre la collaboration au sein de votre équipe.</li>
            <li>Vous envoyer des e-mails transactionnels (vérification de compte, réinitialisation de mot de passe).</li>
            <li>Améliorer les performances et la fiabilité du service.</li>
          </ul>
          <p className="text-muted-foreground mt-3">
            Vos données ne sont jamais vendues, louées ou partagées avec des tiers à des fins commerciales.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">5. Extension Chrome — détail des permissions</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">storage :</strong> mémorise l'URL du serveur AutoBOM
              et la dernière BOM sélectionnée, localement sur votre appareil.
            </li>
            <li>
              <strong className="text-foreground">activeTab :</strong> lit le contenu de l'onglet
              courant uniquement sur les sites fournisseurs déclarés.
            </li>
            <li>
              <strong className="text-foreground">scripting :</strong> injecte les scripts de détection
              de produits sur les pages fournisseurs supportées.
            </li>
            <li>
              <strong className="text-foreground">tabs :</strong> vérifie si l'URL de l'onglet actif
              correspond à un site fournisseur supporté.
            </li>
          </ul>
          <p className="text-muted-foreground mt-3">
            L'extension n'utilise aucun code distant. Tout le code est inclus dans le package de
            l'extension et vérifié lors de la publication sur le Chrome Web Store.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">6. Hébergement et sous-traitants</h2>
          <p className="text-muted-foreground">
            AutoBOM est hébergé sur Vercel (États-Unis). La base de données est hébergée sur Neon
            (PostgreSQL serverless). Les e-mails transactionnels sont envoyés via Resend. Ces
            sous-traitants traitent vos données dans le cadre strict de la fourniture du service.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">7. Conservation des données</h2>
          <p className="text-muted-foreground">
            Vos données sont conservées tant que votre compte est actif. Sur demande de suppression de
            compte, l'ensemble de vos données personnelles et de vos BOM sont supprimées dans un délai
            de 30 jours.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">8. Vos droits</h2>
          <p className="text-muted-foreground">
            Conformément au RGPD, vous disposez des droits suivants sur vos données :
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground mt-3">
            <li>Droit d'accès à vos données.</li>
            <li>Droit de rectification.</li>
            <li>Droit à l'effacement (droit à l'oubli).</li>
            <li>Droit à la portabilité de vos données.</li>
            <li>Droit d'opposition au traitement.</li>
          </ul>
          <p className="text-muted-foreground mt-3">
            Pour exercer ces droits, contactez-nous via l'application ou par e-mail.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">9. Cookies</h2>
          <p className="text-muted-foreground">
            AutoBOM utilise uniquement des cookies de session nécessaires à l'authentification. Aucun
            cookie publicitaire ou de tracking tiers n'est utilisé.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">10. Modifications</h2>
          <p className="text-muted-foreground">
            Cette politique peut être mise à jour. En cas de changement significatif, nous vous en
            informerons par e-mail ou via une notification dans l'application.
          </p>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} AutoBOM — Tous droits réservés.
          </p>
        </div>

      </section>
    </main>
  );
}
