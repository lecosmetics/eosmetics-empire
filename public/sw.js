/* ============================================================================
 * L&E COSMETICS EMPIRE
 * PWA — SERVICE WORKER
 * ============================================================================
 *
 * Fichier :
 *
 * public/sw.js
 *
 * URL publique :
 *
 * /sw.js
 *
 * RÔLE :
 *
 * - permettre l'installation PWA ;
 * - mettre en cache uniquement les ressources statiques sûres ;
 * - ne jamais mettre en cache les pages métier sensibles ;
 * - ne jamais mettre en cache les API ;
 * - ne jamais mettre en cache les requêtes non-GET ;
 * - ne jamais mettre en cache les réponses privées / no-store ;
 * - nettoyer les anciennes versions de caches appartenant à l'application ;
 * - rester compatible avec Next.js App Router sans dépendance externe ;
 * - laisser les données dynamiques provenir du réseau.
 *
 * IMPORTANT :
 *
 * CE SERVICE WORKER NE DOIT PAS METTRE EN CACHE :
 *
 * - /api/*
 * - /gestionnaire/*
 * - /admin/*
 * - /representant/*
 * - /compte/*
 * - /checkout/*
 * - /commande/*
 * - /panier/*
 * - les navigations HTML en général ;
 * - les requêtes contenant Authorization ;
 * - les réponses Cache-Control: no-store / private ;
 * - les requêtes Range ;
 * - les requêtes POST / PUT / PATCH / DELETE.
 *
 * L'objectif est volontairement prudent :
 *
 * - PWA installable ;
 * - assets statiques plus robustes ;
 * - aucune donnée client ou métier conservée dans Cache Storage.
 *
 * ============================================================================
 */


/* ==========================================================================
   VERSION
   ========================================================================== */

/**
 * Incrémenter cette version lorsque la stratégie de cache change.
 *
 * Exemple futur :
 *
 * ce-pwa-v2
 */

const CACHE_VERSION =
  "ce-pwa-v1";


const CACHE_PREFIX =
  "cosmetics-empire";


const PRECACHE_NAME =
  `${CACHE_PREFIX}-precache-${CACHE_VERSION}`;


const RUNTIME_NAME =
  `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`;


/* ==========================================================================
   RESSOURCES STATIQUES À PRÉCACHER
   ========================================================================== */

/**
 * On ne précache que des fichiers statiques connus.
 *
 * Aucune page HTML dynamique n'est précachée ici.
 *
 * Si un fichier manque, l'installation du Service Worker ne doit pas échouer :
 * chaque ressource est donc ajoutée indépendamment.
 */

const PRECACHE_URLS = [
  "/manifest.webmanifest",

  "/icons/pwa/icon-192.png",
  "/icons/pwa/icon-512.png",
  "/icons/pwa/icon-maskable-192.png",
  "/icons/pwa/icon-maskable-512.png",

  "/icons/icon-maskable-512.png",

  "/apple-icon.png",

  "/logos/logo.png",

  "/images/imagecouvre.png",
];


/* ==========================================================================
   ROUTES / PRÉFIXES SENSIBLES
   ========================================================================== */

const SENSITIVE_PATH_PREFIXES = [
  "/api",
  "/gestionnaire",
  "/admin",
  "/representant",
  "/compte",
  "/checkout",
  "/commande",
  "/panier",
];


/* ==========================================================================
   TYPES DE RESSOURCES STATIQUES ACCEPTÉS
   ========================================================================== */

const STATIC_DESTINATIONS =
  new Set([
    "style",
    "script",
    "font",
    "image",
  ]);


/* ==========================================================================
   HELPERS
   ========================================================================== */

/**
 * Vérifie qu'une URL appartient au même origin que l'application.
 */
function isSameOrigin(
  url,
) {
  return (
    url.origin ===
    self.location.origin
  );
}


/**
 * Vérifie si le chemin correspond à une zone sensible.
 */
function isSensitivePath(
  pathname,
) {
  return SENSITIVE_PATH_PREFIXES.some(
    (
      prefix,
    ) =>
      pathname ===
        prefix ||
      pathname.startsWith(
        `${prefix}/`,
      ),
  );
}


/**
 * Vérifie si une requête contient un header Authorization.
 */
function hasAuthorizationHeader(
  request,
) {
  return request.headers.has(
    "authorization",
  );
}


/**
 * Refuse les requêtes partielles.
 *
 * Une réponse Range ne doit pas être insérée telle quelle dans le cache
 * standard de ressources.
 */
function isRangeRequest(
  request,
) {
  return request.headers.has(
    "range",
  );
}


/**
 * Vérifie les directives de cache de la réponse.
 */
function responseAllowsCaching(
  response,
) {
  if (
    !response ||
    !response.ok
  ) {
    return false;
  }


  /**
   * On ne met en cache que des réponses same-origin classiques.
   */
  if (
    response.type !==
      "basic"
  ) {
    return false;
  }


  const cacheControl =
    (
      response.headers.get(
        "cache-control",
      ) ||
      ""
    ).toLowerCase();


  if (
    cacheControl.includes(
      "no-store",
    ) ||
    cacheControl.includes(
      "private",
    )
  ) {
    return false;
  }


  return true;
}


/**
 * Détermine si une requête peut utiliser le cache runtime.
 */
function isRuntimeCacheCandidate(
  request,
  url,
) {
  if (
    request.method !==
      "GET"
  ) {
    return false;
  }


  if (
    !isSameOrigin(
      url,
    )
  ) {
    return false;
  }


  if (
    isSensitivePath(
      url.pathname,
    )
  ) {
    return false;
  }


  if (
    hasAuthorizationHeader(
      request,
    )
  ) {
    return false;
  }


  if (
    isRangeRequest(
      request,
    )
  ) {
    return false;
  }


  /**
   * Les navigations HTML restent toujours réseau.
   *
   * Cela évite de conserver :
   *
   * - une session ;
   * - un panier ;
   * - un checkout ;
   * - une commande ;
   * - un dashboard ;
   * - une page dynamique obsolète.
   */
  if (
    request.mode ===
      "navigate"
  ) {
    return false;
  }


  /**
   * Next.js expose ses bundles versionnés dans /_next/static/.
   *
   * Ils sont sûrs à mettre en cache.
   */
  if (
    url.pathname.startsWith(
      "/_next/static/",
    )
  ) {
    return true;
  }


  /**
   * L'optimiseur d'images Next.js génère des réponses dérivées.
   *
   * On autorise le cache runtime uniquement pour les requêtes image.
   */
  if (
    url.pathname ===
      "/_next/image" &&
    request.destination ===
      "image"
  ) {
    return true;
  }


  /**
   * Ressources statiques same-origin :
   *
   * - CSS ;
   * - JavaScript ;
   * - polices ;
   * - images.
   */
  if (
    STATIC_DESTINATIONS.has(
      request.destination,
    )
  ) {
    return true;
  }


  /**
   * Manifest.
   */
  if (
    request.destination ===
      "manifest"
  ) {
    return true;
  }


  return false;
}


/* ==========================================================================
   CACHE — SAFE PUT
   ========================================================================== */

async function putInCacheSafely(
  cacheName,
  request,
  response,
) {
  if (
    !responseAllowsCaching(
      response,
    )
  ) {
    return;
  }


  try {
    const cache =
      await caches.open(
        cacheName,
      );


    await cache.put(
      request,
      response.clone(),
    );
  } catch {
    /**
     * Une erreur Cache Storage ne doit jamais casser la navigation
     * ou la ressource réseau.
     */
  }
}


/* ==========================================================================
   PRECACHE
   ========================================================================== */

async function precacheStaticAssets() {
  const cache =
    await caches.open(
      PRECACHE_NAME,
    );


  await Promise.allSettled(
    PRECACHE_URLS.map(
      async (
        url,
      ) => {
        try {
          const request =
            new Request(
              url,
              {
                method:
                  "GET",

                cache:
                  "reload",

                credentials:
                  "same-origin",
              },
            );


          const response =
            await fetch(
              request,
            );


          if (
            !responseAllowsCaching(
              response,
            )
          ) {
            return;
          }


          await cache.put(
            request,
            response.clone(),
          );
        } catch {
          /**
           * Une seule ressource absente ne doit pas empêcher
           * l'installation du Service Worker.
           */
        }
      },
    ),
  );
}


/* ==========================================================================
   CLEANUP
   ========================================================================== */

function isApplicationCache(
  cacheName,
) {
  return cacheName.startsWith(
    `${CACHE_PREFIX}-`,
  );
}


function isCurrentCache(
  cacheName,
) {
  return (
    cacheName ===
      PRECACHE_NAME ||
    cacheName ===
      RUNTIME_NAME
  );
}


async function cleanupOldCaches() {
  const cacheNames =
    await caches.keys();


  await Promise.all(
    cacheNames.map(
      (
        cacheName,
      ) => {
        /**
         * Ne jamais supprimer les caches d'une autre application
         * partageant éventuellement le même origin.
         */
        if (
          !isApplicationCache(
            cacheName,
          )
        ) {
          return Promise.resolve(
            false,
          );
        }


        if (
          isCurrentCache(
            cacheName,
          )
        ) {
          return Promise.resolve(
            false,
          );
        }


        return caches.delete(
          cacheName,
        );
      },
    ),
  );
}


/* ==========================================================================
   STRATÉGIE — CACHE FIRST + REVALIDATION
   ========================================================================== */

/**
 * Pour les assets statiques :
 *
 * 1. renvoyer rapidement le cache s'il existe ;
 * 2. vérifier le réseau en arrière-plan ;
 * 3. actualiser le cache si la réponse est sûre.
 *
 * Les bundles Next.js sont versionnés, donc cette stratégie est adaptée
 * aux fichiers /_next/static/*.
 */

async function cacheFirstWithRevalidation(
  request,
) {
  const cachedResponse =
    await caches.match(
      request,
    );


  const networkPromise =
    fetch(
      request,
    )
      .then(
        async (
          networkResponse,
        ) => {
          await putInCacheSafely(
            RUNTIME_NAME,
            request,
            networkResponse,
          );


          return networkResponse;
        },
      )
      .catch(
        () =>
          null,
      );


  if (
    cachedResponse
  ) {
    /**
     * Le fetch réseau continue afin de rafraîchir le cache.
     */
    void networkPromise;


    return cachedResponse;
  }


  const networkResponse =
    await networkPromise;


  if (
    networkResponse
  ) {
    return networkResponse;
  }


  /**
   * Aucun fallback HTML n'est inventé.
   *
   * On renvoie une réponse 504 uniquement pour une ressource statique
   * introuvable hors ligne.
   */
  return new Response(
    "",
    {
      status:
        504,

      statusText:
        "Gateway Timeout",
    },
  );
}


/* ==========================================================================
   INSTALL
   ========================================================================== */

self.addEventListener(
  "install",
  (
    event,
  ) => {
    event.waitUntil(
      precacheStaticAssets(),
    );


    /**
     * On ne force pas skipWaiting() automatiquement.
     *
     * Cela évite qu'une nouvelle version du Service Worker prenne le contrôle
     * au milieu d'une session ou d'un checkout.
     *
     * Une activation explicite est néanmoins supportée via postMessage.
     */
  },
);


/* ==========================================================================
   ACTIVATE
   ========================================================================== */

self.addEventListener(
  "activate",
  (
    event,
  ) => {
    event.waitUntil(
      Promise.all([
        cleanupOldCaches(),

        /**
         * Prend le contrôle des pages existantes après activation normale.
         */
        self.clients.claim(),
      ]),
    );
  },
);


/* ==========================================================================
   MESSAGE
   ========================================================================== */

/**
 * Permet plus tard à l'interface d'envoyer :
 *
 * registration.waiting.postMessage({
 *   type: "SKIP_WAITING",
 * });
 *
 * On ne déclenche jamais ce comportement automatiquement.
 */

self.addEventListener(
  "message",
  (
    event,
  ) => {
    if (
      !event.data ||
      event.data.type !==
        "SKIP_WAITING"
    ) {
      return;
    }


    self.skipWaiting();
  },
);


/* ==========================================================================
   FETCH
   ========================================================================== */

self.addEventListener(
  "fetch",
  (
    event,
  ) => {
    const request =
      event.request;


    /**
     * Jamais de cache pour POST / PUT / PATCH / DELETE / etc.
     */
    if (
      request.method !==
        "GET"
    ) {
      return;
    }


    let url;


    try {
      url =
        new URL(
          request.url,
        );
    } catch {
      return;
    }


    /**
     * Les ressources externes restent entièrement gérées par le navigateur.
     *
     * Exemple :
     *
     * - Supabase Storage ;
     * - services tiers ;
     * - CDN externes.
     */
    if (
      !isSameOrigin(
        url,
      )
    ) {
      return;
    }


    /**
     * Aucune interception des zones sensibles.
     */
    if (
      isSensitivePath(
        url.pathname,
      )
    ) {
      return;
    }


    /**
     * Aucune interception des navigations HTML.
     *
     * Les pages dynamiques continuent donc à venir du réseau.
     */
    if (
      request.mode ===
        "navigate"
    ) {
      return;
    }


    /**
     * Aucune interception si Authorization est présent.
     */
    if (
      hasAuthorizationHeader(
        request,
      )
    ) {
      return;
    }


    /**
     * Aucune interception des requêtes partielles.
     */
    if (
      isRangeRequest(
        request,
      )
    ) {
      return;
    }


    if (
      !isRuntimeCacheCandidate(
        request,
        url,
      )
    ) {
      return;
    }


    event.respondWith(
      cacheFirstWithRevalidation(
        request,
      ),
    );
  },
);


/* ==========================================================================
   FIN
   ========================================================================== */

/**
 * STRATÉGIE ACTUELLE :
 *
 * HTML / navigation
 *   -> réseau uniquement
 *
 * API
 *   -> réseau uniquement
 *
 * espaces privés / checkout / commandes / panier
 *   -> réseau uniquement
 *
 * assets Next.js
 *   -> cache-first + revalidation
 *
 * images / CSS / JS / fonts same-origin
 *   -> cache-first + revalidation
 *
 * ressources externes
 *   -> navigateur / réseau
 *
 *
 * Cette stratégie est volontairement conservatrice pour une application
 * e-commerce avec authentification, panier, commandes et paiements.
 */
