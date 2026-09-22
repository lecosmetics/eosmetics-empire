"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import type {
  ReactNode,
} from "react";

import type {
  PublicPanierAddItemPayload,
  PublicPanierClientApi,
  PublicPanierClientState,
  PublicPanierContextValue,
  PublicPanierItemIntent,
  PublicPanierItemIntentCollection,
  PublicPanierMutationResult,
  PublicPanierPersistedState,
  PublicPanierQuantity,
  PublicPanierRemoveItemPayload,
  PublicPanierSetQuantityPayload,
  PublicPanierStoreProductId,
} from "@/lib/public/panier/public-panier-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PROVIDER — PANIER PUBLIC
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/panier/PublicPanierProvider.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Gérer l'intention locale du Panier public.
 *
 * ============================================================================
 *
 * LE NAVIGATEUR CONSERVE UNIQUEMENT :
 *
 * {
 *   storeProductId,
 *   quantity
 * }
 *
 * ============================================================================
 *
 * LE NAVIGATEUR NE CONSERVE PAS COMME SOURCE DE VÉRITÉ :
 *
 * - prix ;
 * - compareAtPrice ;
 * - devise ;
 * - stock ;
 * - disponibilité ;
 * - statut StoreProduct ;
 * - nom du produit ;
 * - boutique ;
 * - total.
 *
 * ============================================================================
 *
 * Ces données sont obligatoirement rechargées côté serveur par :
 *
 * src/lib/public/panier/public-panier-actions.ts
 *
 * ============================================================================
 *
 * PERSISTANCE :
 *
 * localStorage
 *
 * uniquement pour conserver l'intention d'achat entre les pages.
 *
 * ============================================================================
 *
 * SYNCHRONISATION :
 *
 * - même onglet ;
 * - plusieurs composants Provider ;
 * - plusieurs onglets du navigateur.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce Provider :
 *
 * - ne contacte pas PostgreSQL ;
 * - n'importe pas Prisma ;
 * - ne réserve pas de stock ;
 * - ne crée pas de commande ;
 * - ne crée pas de paiement ;
 * - ne fait confiance à aucun prix navigateur ;
 * - ne crée pas de modèle Cart/Panier en base.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION TECHNIQUE
   ========================================================================== */

export const PUBLIC_PANIER_STORAGE_KEY =
  "cosmetics-empire:public-panier:v1";


const PUBLIC_PANIER_CHANGE_EVENT =
  "cosmetics-empire:public-panier:change";


const PUBLIC_PANIER_STORAGE_VERSION =
  1 as const;


const PUBLIC_PANIER_STORE_PRODUCT_ID_MAX_LENGTH =
  191;


/* ==========================================================================
   2. PROPS
   ========================================================================== */

interface PublicPanierProviderProps {
  readonly children:
    ReactNode;
}


/* ==========================================================================
   3. ÉTAT SERVEUR
   ========================================================================== */

/**
 * Snapshot utilisé pendant le rendu serveur.
 *
 * hydrated = false
 *
 * permet aux composants de savoir que localStorage n'a pas encore
 * été consulté.
 */
const PUBLIC_PANIER_SERVER_STATE:
  PublicPanierClientState = {
    items:
      [],

    itemCount:
      0,

    totalQuantity:
      0,

    hydrated:
      false,
  };


/* ==========================================================================
   4. CACHE CLIENT
   ========================================================================== */

/**
 * useSyncExternalStore exige un snapshot stable tant que les données
 * n'ont pas réellement changé.
 *
 * On conserve donc le dernier snapshot dans ce cache module.
 */
let publicPanierClientState:
  PublicPanierClientState =
    PUBLIC_PANIER_SERVER_STATE;


let publicPanierClientInitialized =
  false;


/* ==========================================================================
   5. CONTEXTE
   ========================================================================== */

const PublicPanierContext =
  createContext<
    PublicPanierContextValue |
    null
  >(
    null,
  );


/* ==========================================================================
   6. NORMALISATION IDENTIFIANT
   ========================================================================== */

function normalizeStoreProductId(
  value:
    unknown,
): PublicPanierStoreProductId |
  null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  if (
    normalized.length ===
      0 ||
    normalized.length >
      PUBLIC_PANIER_STORE_PRODUCT_ID_MAX_LENGTH
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   7. NORMALISATION QUANTITÉ
   ========================================================================== */

function normalizeQuantity(
  value:
    unknown,
): PublicPanierQuantity |
  null {
  if (
    typeof value !==
    "number"
  ) {
    return null;
  }


  if (
    !Number.isFinite(
      value,
    ) ||
    !Number.isSafeInteger(
      value,
    ) ||
    value <=
      0
  ) {
    return null;
  }


  return value;
}


/* ==========================================================================
   8. NORMALISATION COLLECTION
   ========================================================================== */

/**
 * Nettoie et déduplique les intentions.
 *
 * La clé est exclusivement :
 *
 * StoreProduct.id
 *
 * JAMAIS Product.id.
 */
function normalizePanierItems(
  rawItems:
    unknown,
): PublicPanierItemIntent[] {
  if (
    !Array.isArray(
      rawItems,
    )
  ) {
    return [];
  }


  const itemsByStoreProductId =
    new Map<
      PublicPanierStoreProductId,
      PublicPanierQuantity
    >();


  for (
    const rawItem
    of rawItems
  ) {
    if (
      typeof rawItem !==
        "object" ||
      rawItem ===
        null
    ) {
      continue;
    }


    const candidate =
      rawItem as {
        storeProductId?:
          unknown;

        quantity?:
          unknown;
      };


    const storeProductId =
      normalizeStoreProductId(
        candidate
          .storeProductId,
      );


    const quantity =
      normalizeQuantity(
        candidate
          .quantity,
      );


    if (
      !storeProductId ||
      quantity ===
        null
    ) {
      continue;
    }


    const previousQuantity =
      itemsByStoreProductId.get(
        storeProductId,
      ) ??
      0;


    const mergedQuantity =
      previousQuantity +
      quantity;


    if (
      !Number.isSafeInteger(
        mergedQuantity,
      )
    ) {
      continue;
    }


    itemsByStoreProductId.set(
      storeProductId,
      mergedQuantity,
    );
  }


  return Array.from(
    itemsByStoreProductId.entries(),
  ).map(
    (
      [
        storeProductId,
        quantity,
      ],
    ) => ({
      storeProductId,

      quantity,
    }),
  );
}


/* ==========================================================================
   9. CONSTRUCTION ÉTAT CLIENT
   ========================================================================== */

function buildClientState(
  items:
    PublicPanierItemIntentCollection,

  hydrated:
    boolean,
): PublicPanierClientState {
  let totalQuantity =
    0;


  for (
    const item
    of items
  ) {
    const nextTotal =
      totalQuantity +
      item.quantity;


    if (
      !Number.isSafeInteger(
        nextTotal,
      )
    ) {
      continue;
    }


    totalQuantity =
      nextTotal;
  }


  return {
    items,

    itemCount:
      items.length,

    totalQuantity,

    hydrated,
  };
}


/* ==========================================================================
   10. ÉTAT PERSISTABLE
   ========================================================================== */

function buildPersistedState(
  items:
    PublicPanierItemIntentCollection,
): PublicPanierPersistedState {
  return {
    version:
      PUBLIC_PANIER_STORAGE_VERSION,

    items,
  };
}


/* ==========================================================================
   11. LECTURE LOCALSTORAGE
   ========================================================================== */

function readItemsFromStorage():
  PublicPanierItemIntent[] {
  if (
    typeof window ===
    "undefined"
  ) {
    return [];
  }


  try {
    const raw =
      window.localStorage.getItem(
        PUBLIC_PANIER_STORAGE_KEY,
      );


    if (
      !raw
    ) {
      return [];
    }


    const parsed:
      unknown =
        JSON.parse(
          raw,
        );


    if (
      typeof parsed !==
        "object" ||
      parsed ===
        null
    ) {
      return [];
    }


    const candidate =
      parsed as {
        version?:
          unknown;

        items?:
          unknown;
      };


    /**
     * Une version inconnue n'est jamais interprétée arbitrairement.
     */
    if (
      candidate.version !==
      PUBLIC_PANIER_STORAGE_VERSION
    ) {
      return [];
    }


    return normalizePanierItems(
      candidate.items,
    );
  } catch {
    /**
     * localStorage peut être :
     *
     * - bloqué ;
     * - indisponible ;
     * - corrompu ;
     * - rempli avec un JSON invalide.
     *
     * Cela ne doit jamais casser l'application.
     */
    return [];
  }
}


/* ==========================================================================
   12. ÉCRITURE LOCALSTORAGE
   ========================================================================== */

function writeItemsToStorage(
  items:
    PublicPanierItemIntentCollection,
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }


  try {
    const persistedState =
      buildPersistedState(
        items,
      );


    window.localStorage.setItem(
      PUBLIC_PANIER_STORAGE_KEY,

      JSON.stringify(
        persistedState,
      ),
    );
  } catch {
    /**
     * Le Provider conserve malgré tout son état mémoire.
     *
     * L'échec de persistance navigateur ne doit pas provoquer
     * une erreur React.
     */
  }
}


/* ==========================================================================
   13. INITIALISATION CLIENT
   ========================================================================== */

function initializeClientState():
  void {
  if (
    publicPanierClientInitialized
  ) {
    return;
  }


  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }


  publicPanierClientInitialized =
    true;


  const items =
    readItemsFromStorage();


  publicPanierClientState =
    buildClientState(
      items,
      true,
    );
}


/* ==========================================================================
   14. SNAPSHOT CLIENT
   ========================================================================== */

function getClientSnapshot():
  PublicPanierClientState {
  initializeClientState();


  return publicPanierClientState;
}


/* ==========================================================================
   15. SNAPSHOT SERVEUR
   ========================================================================== */

function getServerSnapshot():
  PublicPanierClientState {
  return PUBLIC_PANIER_SERVER_STATE;
}


/* ==========================================================================
   16. NOTIFICATION MÊME ONGLET
   ========================================================================== */

function dispatchPanierChangeEvent():
  void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }


  window.dispatchEvent(
    new Event(
      PUBLIC_PANIER_CHANGE_EVENT,
    ),
  );
}


/* ==========================================================================
   17. COMMIT
   ========================================================================== */

function commitPanierItems(
  items:
    PublicPanierItemIntentCollection,
): void {
  const normalizedItems =
    normalizePanierItems(
      items,
    );


  publicPanierClientInitialized =
    true;


  publicPanierClientState =
    buildClientState(
      normalizedItems,
      true,
    );


  writeItemsToStorage(
    normalizedItems,
  );


  dispatchPanierChangeEvent();
}


/* ==========================================================================
   18. SYNCHRONISATION DEPUIS STORAGE
   ========================================================================== */

function synchronizeClientStateFromStorage():
  void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }


  publicPanierClientInitialized =
    true;


  publicPanierClientState =
    buildClientState(
      readItemsFromStorage(),
      true,
    );
}


/* ==========================================================================
   19. SUBSCRIPTION EXTERNAL STORE
   ========================================================================== */

function subscribePublicPanier(
  listener:
    () => void,
): () => void {
  if (
    typeof window ===
    "undefined"
  ) {
    return () => {
      // Aucun abonnement côté serveur.
    };
  }


  function handleLocalChange():
    void {
    listener();
  }


  function handleStorageChange(
    event:
      StorageEvent,
  ): void {
    /**
     * key === null peut arriver lorsque localStorage.clear() est appelé.
     */
    if (
      event.key !==
        PUBLIC_PANIER_STORAGE_KEY &&
      event.key !==
        null
    ) {
      return;
    }


    synchronizeClientStateFromStorage();


    listener();
  }


  window.addEventListener(
    PUBLIC_PANIER_CHANGE_EVENT,
    handleLocalChange,
  );


  window.addEventListener(
    "storage",
    handleStorageChange,
  );


  return () => {
    window.removeEventListener(
      PUBLIC_PANIER_CHANGE_EVENT,
      handleLocalChange,
    );


    window.removeEventListener(
      "storage",
      handleStorageChange,
    );
  };
}


/* ==========================================================================
   20. RECHERCHE QUANTITÉ
   ========================================================================== */

function getStoredItemQuantity(
  storeProductId:
    PublicPanierStoreProductId,
): PublicPanierQuantity {
  const normalizedId =
    normalizeStoreProductId(
      storeProductId,
    );


  if (
    !normalizedId
  ) {
    return 0;
  }


  const state =
    getClientSnapshot();


  const item =
    state.items.find(
      (
        currentItem,
      ) =>
        currentItem
          .storeProductId ===
        normalizedId,
    );


  return (
    item?.quantity ??
    0
  );
}


/* ==========================================================================
   21. AJOUT
   ========================================================================== */

function addPanierItem(
  payload:
    PublicPanierAddItemPayload,
): PublicPanierMutationResult {
  const storeProductId =
    normalizeStoreProductId(
      payload.storeProductId,
    );


  if (
    !storeProductId
  ) {
    return {
      success:
        false,

      code:
        "INVALID_STORE_PRODUCT_ID",
    };
  }


  const quantity =
    normalizeQuantity(
      payload.quantity,
    );


  if (
    quantity ===
    null
  ) {
    return {
      success:
        false,

      code:
        "INVALID_QUANTITY",
    };
  }


  const state =
    getClientSnapshot();


  const currentQuantity =
    state.items.find(
      (
        item,
      ) =>
        item.storeProductId ===
        storeProductId,
    )?.quantity ??
    0;


  const nextQuantity =
    currentQuantity +
    quantity;


  if (
    !Number.isSafeInteger(
      nextQuantity,
    ) ||
    nextQuantity <=
      0
  ) {
    return {
      success:
        false,

      code:
        "INVALID_QUANTITY",
    };
  }


  const nextItems =
    state.items.filter(
      (
        item,
      ) =>
        item.storeProductId !==
        storeProductId,
    );


  commitPanierItems([
    ...nextItems,

    {
      storeProductId,

      quantity:
        nextQuantity,
    },
  ]);


  return {
    success:
      true,
  };
}


/* ==========================================================================
   22. MODIFICATION DE QUANTITÉ
   ========================================================================== */

function setPanierItemQuantity(
  payload:
    PublicPanierSetQuantityPayload,
): PublicPanierMutationResult {
  const storeProductId =
    normalizeStoreProductId(
      payload.storeProductId,
    );


  if (
    !storeProductId
  ) {
    return {
      success:
        false,

      code:
        "INVALID_STORE_PRODUCT_ID",
    };
  }


  const quantity =
    normalizeQuantity(
      payload.quantity,
    );


  if (
    quantity ===
    null
  ) {
    return {
      success:
        false,

      code:
        "INVALID_QUANTITY",
    };
  }


  const state =
    getClientSnapshot();


  const itemExists =
    state.items.some(
      (
        item,
      ) =>
        item.storeProductId ===
        storeProductId,
    );


  if (
    !itemExists
  ) {
    return {
      success:
        false,

      code:
        "ITEM_NOT_FOUND",
    };
  }


  const nextItems =
    state.items.map(
      (
        item,
      ) =>
        item.storeProductId ===
        storeProductId
          ? {
              storeProductId,

              quantity,
            }
          : item,
    );


  commitPanierItems(
    nextItems,
  );


  return {
    success:
      true,
  };
}


/* ==========================================================================
   23. SUPPRESSION
   ========================================================================== */

function removePanierItem(
  payload:
    PublicPanierRemoveItemPayload,
): PublicPanierMutationResult {
  const storeProductId =
    normalizeStoreProductId(
      payload.storeProductId,
    );


  if (
    !storeProductId
  ) {
    return {
      success:
        false,

      code:
        "INVALID_STORE_PRODUCT_ID",
    };
  }


  const state =
    getClientSnapshot();


  const itemExists =
    state.items.some(
      (
        item,
      ) =>
        item.storeProductId ===
        storeProductId,
    );


  if (
    !itemExists
  ) {
    return {
      success:
        false,

      code:
        "ITEM_NOT_FOUND",
    };
  }


  commitPanierItems(
    state.items.filter(
      (
        item,
      ) =>
        item.storeProductId !==
        storeProductId,
    ),
  );


  return {
    success:
      true,
  };
}


/* ==========================================================================
   24. VIDER LE PANIER
   ========================================================================== */

function clearPublicPanier():
  PublicPanierMutationResult {
  commitPanierItems(
    [],
  );


  return {
    success:
      true,
  };
}


/* ==========================================================================
   25. API CLIENT
   ========================================================================== */

const PUBLIC_PANIER_CLIENT_API:
  PublicPanierClientApi = {
    addItem:
      addPanierItem,

    setQuantity:
      setPanierItemQuantity,

    removeItem:
      removePanierItem,

    clear:
      clearPublicPanier,

    getItemQuantity:
      getStoredItemQuantity,
  };


/* ==========================================================================
   26. PROVIDER
   ========================================================================== */

export default function PublicPanierProvider({
  children,
}: PublicPanierProviderProps) {
  /**
   * useSyncExternalStore est utilisé au lieu d'un useEffect + setState.
   *
   * Avantages :
   *
   * - rendu SSR sûr ;
   * - hydratation propre ;
   * - synchronisation multi-onglets ;
   * - pas de setState artificiel dans un effet ;
   * - snapshot stable.
   */
  const state =
    useSyncExternalStore(
      subscribePublicPanier,
      getClientSnapshot,
      getServerSnapshot,
    );


  const value =
    useMemo<
      PublicPanierContextValue
    >(
      () => ({
        state,

        actions:
          PUBLIC_PANIER_CLIENT_API,
      }),

      [
        state,
      ],
    );


  return (
    <PublicPanierContext.Provider
      value={
        value
      }
    >
      {
        children
      }
    </PublicPanierContext.Provider>
  );
}


/* ==========================================================================
   27. HOOK
   ========================================================================== */

/**
 * Hook officiel d'accès au Panier public.
 *
 * Il doit être utilisé uniquement sous :
 *
 * <PublicPanierProvider>
 */
export function usePublicPanier():
  PublicPanierContextValue {
  const context =
    useContext(
      PublicPanierContext,
    );


  if (
    !context
  ) {
    throw new Error(
      "usePublicPanier doit être utilisé à l’intérieur de PublicPanierProvider.",
    );
  }


  return context;
}


/* ==========================================================================
   28. HOOK QUANTITÉ TOTALE
   ========================================================================== */

/**
 * Petit helper pratique pour le badge du Header / Bottom Nav.
 */
export function usePublicPanierTotalQuantity():
  PublicPanierQuantity {
  const {
    state,
  } =
    usePublicPanier();


  return state.totalQuantity;
}


/* ==========================================================================
   29. HOOK NOMBRE DE LIGNES
   ========================================================================== */

export function usePublicPanierItemCount():
  number {
  const {
    state,
  } =
    usePublicPanier();


  return state.itemCount;
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * STOCKAGE NAVIGATEUR :
 *
 * {
 *   version: 1,
 *   items: [
 *     {
 *       storeProductId,
 *       quantity
 *     }
 *   ]
 * }
 *
 * ============================================================================
 *
 * AUCUN :
 *
 * - prix ;
 * - compareAtPrice ;
 * - devise ;
 * - stock ;
 * - disponibilité ;
 * - boutique ;
 * - total.
 *
 * n'est persisté comme vérité commerciale.
 *
 * ============================================================================
 *
 * AJOUT :
 *
 * même StoreProduct.id
 *
 * +
 *
 * nouvelle quantité
 *
 * =
 *
 * une seule ligne avec quantité cumulée.
 *
 * ============================================================================
 *
 * SUPPRESSION :
 *
 * basée exclusivement sur StoreProduct.id.
 *
 * ============================================================================
 *
 * SYNCHRONISATION :
 *
 * même onglet
 *
 * +
 *
 * autres onglets
 *
 * ============================================================================
 *
 * SSR :
 *
 * hydrated = false
 *
 * puis après accès navigateur :
 *
 * hydrated = true
 *
 * ============================================================================
 *
 * AVANT AFFICHAGE COMMERCIAL FIABLE :
 *
 * validatePublicPanier()
 *
 * doit recharger les vraies données serveur.
 *
 * ============================================================================
 *
 * AVANT COMMANDE :
 *
 * nouvelle validation serveur obligatoire.
 *
 * ============================================================================
 */