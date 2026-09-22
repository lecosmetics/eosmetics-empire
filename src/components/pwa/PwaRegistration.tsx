"use client";

import {
  useEffect,
} from "react";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PWA — SERVICE WORKER REGISTRATION
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/pwa/PwaRegistration.tsx
 *
 * RÔLE :
 *
 * - enregistrer le Service Worker côté navigateur ;
 * - ne jamais exécuter cette logique côté serveur ;
 * - utiliser /sw.js comme Service Worker racine ;
 * - appliquer le scope "/" ;
 * - demander au navigateur de vérifier les mises à jour du Service Worker ;
 * - éviter tout traitement inutile lorsque Service Worker n'est pas supporté ;
 * - ne jamais bloquer le rendu de l'application ;
 * - ne rendre aucun élément visuel.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne contient aucune logique métier ;
 * - ne touche pas à Prisma ;
 * - ne touche pas aux sessions ;
 * - ne gère pas le bouton "Installer" ;
 * - ne gère pas directement beforeinstallprompt ;
 * - ne crée pas le fichier sw.js ;
 * - ne force jamais un rechargement de page ;
 * - ne supprime jamais arbitrairement les caches du navigateur.
 *
 * Le Service Worker attendu doit être présent ici :
 *
 * public/sw.js
 *
 * et sera donc servi publiquement sous :
 *
 * /sw.js
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const SERVICE_WORKER_URL =
  "/sw.js";


const SERVICE_WORKER_SCOPE =
  "/";


/* ==========================================================================
   LOGS DE DÉVELOPPEMENT
   ========================================================================== */

/**
 * Les logs sont volontairement limités au développement.
 *
 * En production :
 *
 * - aucun bruit console inutile ;
 * - aucune donnée utilisateur ;
 * - aucun secret ;
 * - aucun détail d'infrastructure sensible.
 */

function logDevelopmentInfo(
  message:
    string,
  details?:
    unknown,
): void {
  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    return;
  }


  if (
    details ===
      undefined
  ) {
    console.info(
      `[Cosmetics Empire][PWA] ${message}`,
    );

    return;
  }


  console.info(
    `[Cosmetics Empire][PWA] ${message}`,
    details,
  );
}


function logDevelopmentError(
  message:
    string,
  error:
    unknown,
): void {
  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    return;
  }


  console.error(
    `[Cosmetics Empire][PWA] ${message}`,
    {
      errorName:
        error instanceof
          Error
          ? error.name
          : "UnknownError",

      errorMessage:
        error instanceof
          Error
          ? error.message
          : null,
    },
  );
}


/* ==========================================================================
   ENVIRONNEMENT NAVIGATEUR
   ========================================================================== */

function canUseServiceWorker():
  boolean {
  return (
    typeof window !==
      "undefined" &&
    typeof navigator !==
      "undefined" &&
    "serviceWorker" in
      navigator
  );
}


/* ==========================================================================
   REGISTRATION
   ========================================================================== */

async function registerServiceWorker():
  Promise<void> {
  if (
    !canUseServiceWorker()
  ) {
    logDevelopmentInfo(
      "Service Worker non supporté par ce navigateur.",
    );

    return;
  }


  try {
    const registration =
      await navigator.serviceWorker.register(
        SERVICE_WORKER_URL,
        {
          scope:
            SERVICE_WORKER_SCOPE,

          /**
           * Le Service Worker se trouve dans /public.
           *
           * "classic" évite d'imposer un Service Worker ESM tant que
           * l'architecture du fichier public/sw.js ne le nécessite pas.
           */
          type:
            "classic",

          /**
           * Demande au navigateur de vérifier le script réseau
           * sans dépendre inutilement du cache HTTP intermédiaire.
           */
          updateViaCache:
            "none",
        },
      );


    logDevelopmentInfo(
      "Service Worker enregistré.",
      {
        scope:
          registration.scope,
      },
    );


    /**
     * update() ne remplace pas immédiatement le worker actif.
     *
     * Il demande uniquement au navigateur de vérifier si une nouvelle
     * version de /sw.js existe.
     *
     * Le cycle de vie normal install -> waiting -> activate reste respecté.
     */
    try {
      await registration.update();
    } catch (
      error
    ) {
      /**
       * Une impossibilité de vérifier une mise à jour ne doit jamais casser
       * le chargement de l'application lorsque le worker est déjà enregistré.
       */
      logDevelopmentError(
        "Impossible de vérifier immédiatement une mise à jour du Service Worker.",
        error,
      );
    }
  } catch (
    error
  ) {
    /**
     * L'échec PWA ne doit jamais empêcher le site de fonctionner
     * normalement dans le navigateur.
     */
    logDevelopmentError(
      "Échec de l'enregistrement du Service Worker.",
      error,
    );
  }
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function PwaRegistration() {
  useEffect(
    () => {
      /**
       * On attend le chargement complet de la page lorsque nécessaire.
       *
       * Cela évite de mettre le Service Worker en concurrence avec les
       * ressources critiques du premier rendu.
       */
      if (
        document.readyState ===
        "complete"
      ) {
        void registerServiceWorker();

        return;
      }


      const handleWindowLoad =
        () => {
          void registerServiceWorker();
        };


      window.addEventListener(
        "load",
        handleWindowLoad,
        {
          once:
            true,
        },
      );


      return () => {
        window.removeEventListener(
          "load",
          handleWindowLoad,
        );
      };
    },
    [],
  );


  return null;
}


/* ==========================================================================
   FIN
   ========================================================================== */

/**
 * Ce composant doit être monté une seule fois, idéalement dans :
 *
 * src/app/layout.tsx
 *
 * Exemple :
 *
 * <body>
 *   <PwaRegistration />
 *   {children}
 * </body>
 *
 * Le fichier public/sw.js doit être créé avant les tests PWA complets.
 */