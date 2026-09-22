"use client";

import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  useRouter,
} from "next/navigation";


/* ============================================================
   L&E COSMETICS EMPIRE
   DASHBOARD AUTO REFRESH
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/dashboard/
   DashboardAutoRefresh.tsx

   OBJECTIF :

   Maintenir les données privées du Dashboard suffisamment
   fraîches sans infrastructure temps réel complexe.

   STRATÉGIE :

   - refresh automatique toutes les 45 secondes ;
   - aucun refresh inutile lorsque l'onglet est masqué ;
   - aucun refresh volontaire lorsque le navigateur est offline ;
   - refresh au retour sur l'onglet si les données sont anciennes ;
   - refresh au retour sur la fenêtre ;
   - refresh au retour de connexion ;
   - aucune API de polling supplémentaire ;
   - aucun WebSocket ;
   - aucun SSE.

   router.refresh() demande à Next.js de recalculer les
   Server Components de la route actuelle.

   Le shell Gestionnaire reste monté.
   ============================================================ */


/* ============================================================
   CONFIGURATION
   ============================================================ */

const DEFAULT_REFRESH_INTERVAL_MS =
  45_000;


const STALE_AFTER_MS =
  30_000;


const MIN_REFRESH_GAP_MS =
  5_000;


const MIN_ALLOWED_INTERVAL_MS =
  15_000;


/* ============================================================
   PROPS
   ============================================================ */

type DashboardAutoRefreshProps =
  Readonly<{
    intervalMs?:
      number;
  }>;


/* ============================================================
   NORMALIZE INTERVAL
   ============================================================ */

function normalizeInterval(
  value:
    number | undefined,
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    ) ||
    value <
      MIN_ALLOWED_INTERVAL_MS
  ) {
    return DEFAULT_REFRESH_INTERVAL_MS;
  }


  return Math.floor(
    value,
  );
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function DashboardAutoRefresh({
  intervalMs,
}: DashboardAutoRefreshProps) {
  const router =
    useRouter();


  const refreshInterval =
    normalizeInterval(
      intervalMs,
    );


  /* ==========================================================
     REFERENCES
     ----------------------------------------------------------
     IMPORTANT :

     Ne pas utiliser :

     useRef(Date.now())

     car Date.now() est une fonction impure appelée pendant le
     rendu React.

     Les valeurs réelles sont initialisées dans useEffect.
     ========================================================== */

  const lastRefreshAtRef =
    useRef<number>(
      0,
    );


  const mountedRef =
    useRef<boolean>(
      false,
    );


  /* ==========================================================
     CAN REFRESH
     ========================================================== */

  const canRefresh =
    useCallback(
      (): boolean => {
        if (
          !mountedRef.current
        ) {
          return false;
        }


        /*
         * Ne pas rafraîchir lorsque l'onglet est masqué.
         */

        if (
          document.visibilityState !==
          "visible"
        ) {
          return false;
        }


        /*
         * Ne pas lancer volontairement un refresh lorsque le
         * navigateur indique qu'il est hors ligne.
         */

        if (
          navigator.onLine ===
          false
        ) {
          return false;
        }


        return true;
      },
      [],
    );


  /* ==========================================================
     REFRESH DASHBOARD
     ========================================================== */

  const refreshDashboard =
    useCallback(
      (
        force:
          boolean = false,
      ): void => {
        if (
          !canRefresh()
        ) {
          return;
        }


        const now =
          Date.now();


        const lastRefreshAt =
          lastRefreshAtRef.current;


        /*
         * Si la ref n'a pas encore été initialisée par useEffect,
         * on mémorise simplement le moment actuel.
         */

        if (
          lastRefreshAt <=
          0
        ) {
          lastRefreshAtRef.current =
            now;

          return;
        }


        const elapsed =
          now -
          lastRefreshAt;


        /*
         * Protection contre plusieurs événements très proches :
         *
         * - focus ;
         * - visibilitychange ;
         * - online ;
         * - interval.
         */

        if (
          elapsed <
          MIN_REFRESH_GAP_MS
        ) {
          return;
        }


        /*
         * Pour un refresh non forcé, les données doivent être
         * suffisamment anciennes.
         */

        if (
          !force &&
          elapsed <
            STALE_AFTER_MS
        ) {
          return;
        }


        /*
         * On mémorise le moment AVANT router.refresh().
         *
         * Cela évite qu'un deuxième événement déclenché presque
         * simultanément demande un second refresh.
         */

        lastRefreshAtRef.current =
          now;


        /*
         * Recharge les Server Components de la route courante.
         *
         * Cela permet à dashboard/page.tsx de récupérer les
         * dernières données PostgreSQL via le service serveur,
         * sans window.location.reload().
         */

        router.refresh();
      },
      [
        canRefresh,
        router,
      ],
    );


  /* ==========================================================
     AUTO REFRESH LIFECYCLE
     ========================================================== */

  useEffect(
    () => {
      /* --------------------------------------------------------
         MOUNT
         -------------------------------------------------------- */

      mountedRef.current =
        true;


      /*
       * Le premier rendu serveur vient d'être reçu.
       * On considère donc les données comme fraîches maintenant.
       *
       * Date.now() est ici dans un effet :
       * aucune fonction impure n'est exécutée pendant le rendu.
       */

      lastRefreshAtRef.current =
        Date.now();


      /* --------------------------------------------------------
         PERIODIC REFRESH
         -------------------------------------------------------- */

      const intervalId =
        window.setInterval(
          () => {
            refreshDashboard(
              true,
            );
          },
          refreshInterval,
        );


      /* --------------------------------------------------------
         VISIBILITY CHANGE
         --------------------------------------------------------
         Exemple :

         Dashboard ouvert
               ↓
         utilisateur change d'onglet
               ↓
         il revient plusieurs minutes plus tard
               ↓
         refresh immédiat si les données sont anciennes
         -------------------------------------------------------- */

      function handleVisibilityChange(): void {
        if (
          document.visibilityState !==
          "visible"
        ) {
          return;
        }


        const lastRefreshAt =
          lastRefreshAtRef.current;


        if (
          lastRefreshAt <=
          0
        ) {
          lastRefreshAtRef.current =
            Date.now();

          return;
        }


        const elapsed =
          Date.now() -
          lastRefreshAt;


        if (
          elapsed >=
          STALE_AFTER_MS
        ) {
          refreshDashboard(
            true,
          );
        }
      }


      /* --------------------------------------------------------
         WINDOW FOCUS
         --------------------------------------------------------
         Utile lorsque l'utilisateur revient dans le navigateur
         après avoir travaillé dans une autre application.
         -------------------------------------------------------- */

      function handleWindowFocus(): void {
        const lastRefreshAt =
          lastRefreshAtRef.current;


        if (
          lastRefreshAt <=
          0
        ) {
          lastRefreshAtRef.current =
            Date.now();

          return;
        }


        const elapsed =
          Date.now() -
          lastRefreshAt;


        if (
          elapsed >=
          STALE_AFTER_MS
        ) {
          refreshDashboard(
            true,
          );
        }
      }


      /* --------------------------------------------------------
         CONNECTION RESTORED
         --------------------------------------------------------
         Après une coupure réseau, le Dashboard peut récupérer
         les données fraîches dès que la connexion revient.
         -------------------------------------------------------- */

      function handleOnline(): void {
        const lastRefreshAt =
          lastRefreshAtRef.current;


        if (
          lastRefreshAt <=
          0
        ) {
          lastRefreshAtRef.current =
            Date.now();

          return;
        }


        const elapsed =
          Date.now() -
          lastRefreshAt;


        if (
          elapsed >=
          MIN_REFRESH_GAP_MS
        ) {
          refreshDashboard(
            true,
          );
        }
      }


      /* --------------------------------------------------------
         EVENTS
         -------------------------------------------------------- */

      document.addEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );


      window.addEventListener(
        "focus",
        handleWindowFocus,
      );


      window.addEventListener(
        "online",
        handleOnline,
      );


      /* --------------------------------------------------------
         CLEANUP
         -------------------------------------------------------- */

      return () => {
        mountedRef.current =
          false;


        window.clearInterval(
          intervalId,
        );


        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );


        window.removeEventListener(
          "focus",
          handleWindowFocus,
        );


        window.removeEventListener(
          "online",
          handleOnline,
        );
      };
    },
    [
      refreshDashboard,
      refreshInterval,
    ],
  );


  /* ==========================================================
     NO VISUAL OUTPUT
     ----------------------------------------------------------
     Ce composant ne produit aucun élément visible.

     Il ne modifie donc jamais :
     - la largeur du Dashboard ;
     - les espacements ;
     - la maquette ;
     - le responsive.
     ========================================================== */

  return null;
}