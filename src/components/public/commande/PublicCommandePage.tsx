"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  LoaderCircle,
  LockKeyhole,
  PackageCheck,
  RefreshCcw,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";

import {
  PUBLIC_DELIVERY_COUNTRY_CODES,
} from "@/config/public-delivery";

import {
  generalAppRoutes,
} from "@/config/routes";

import {
  usePublicPanier,
} from "@/components/public/panier/PublicPanierProvider";

import PublicCommandeCustomerSection from "./PublicCommandeCustomerSection";

import PublicCommandeDeliverySection from "./PublicCommandeDeliverySection";

import type {
  PublicCommandeCountryOption,
  PublicCommandeDeliveryField,
} from "./PublicCommandeDeliverySection";

import PublicCommandeSummary from "./PublicCommandeSummary";

import {
  calculatePublicCommandeDeliveryAction,
  loadPublicCommandeForCheckout,
  preparePublicCommandeCheckout,
} from "@/lib/public/commande/public-commande-actions";

import {
  safeParsePublicCommandePrepareInput,
} from "@/lib/public/commande/public-commande-schema";

import type {
  PublicCommandeAddressInput,
  PublicCommandeCustomerInput,
  PublicCommandeDeliveryState,
  PublicCommandeFieldErrors,
  PublicCommandePrepareInput,
  PublicCommandePreparedCheckout,
  PublicCommandeSnapshot,
  PublicCommandeSummary as PublicCommandeSummaryData,
} from "@/lib/public/commande/public-commande-types";

import type {
  PublicCommandeCustomerField,
} from "./PublicCommandeCustomerSection";

import styles from "./public-commande.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PAGE PUBLIQUE — COMMANDE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/commande/PublicCommandePage.tsx
 *
 * Route :
 *
 * /commande
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Orchestrer l'étape Informations + Livraison avant :
 *
 * /commande/paiement
 *
 * ============================================================================
 *
 * FLUX :
 *
 * PublicPanierProvider
 *
 *          ↓
 *
 * storeProductId
 * quantity
 *
 *          ↓
 *
 * relecture serveur du Panier
 *
 *          ↓
 *
 * informations cliente
 *
 *          ↓
 *
 * adresse
 *
 *          ↓
 *
 * calcul serveur livraison
 *
 *          ↓
 *
 * préparation serveur complète
 *
 *          ↓
 *
 * résumé fiable
 *
 *          ↓
 *
 * /commande/paiement
 *
 * ============================================================================
 *
 * SÉCURITÉ :
 *
 * Le navigateur ne fournit jamais comme vérité :
 *
 * - prix ;
 * - devise ;
 * - stock ;
 * - sous-total ;
 * - frais de livraison ;
 * - total ;
 * - statut de paiement.
 *
 * ============================================================================
 *
 * Même lorsqu'un brouillon est transmis vers l'étape paiement, seules les
 * données brutes suivantes sont conservées :
 *
 * - cliente ;
 * - adresse ;
 * - storeProductId ;
 * - quantity.
 *
 * public-payment-actions.ts devra obligatoirement revalider les données
 * commerciales avant toute création réelle de commande ou paiement.
 *
 * ============================================================================
 *
 * STABILITÉ REACT :
 *
 * - le calcul de livraison dépend de l'adresse et de la disponibilité réelle
 *   du snapshot, pas de l'identité complète de l'objet snapshot ;
 * - la préparation automatique ne repart pas lorsqu'un checkout est déjà
 *   préparé pour la signature courante ;
 * - un nouveau snapshot renvoyé par le serveur ne déclenche donc pas une
 *   boucle livraison → préparation → livraison.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. BROUILLON NAVIGATEUR ENTRE LES DEUX ROUTES
   ========================================================================== */

/**
 * sessionStorage est utilisé uniquement pour transporter le brouillon entre :
 *
 * /commande
 *
 * et :
 *
 * /commande/paiement
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce brouillon n'est JAMAIS une source de vérité financière.
 *
 * Aucun :
 *
 * - prix ;
 * - stock ;
 * - shippingAmount ;
 * - total ;
 * - statut paiement
 *
 * n'y est enregistré.
 */
export const PUBLIC_COMMANDE_PAYMENT_DRAFT_STORAGE_KEY =
  "le-cosmetics-public-commande-payment-draft-v1";


interface PublicCommandeBrowserDraft {
  readonly version:
    1;

  readonly createdAt:
    string;

  readonly input:
    PublicCommandePrepareInput;
}


/* ==========================================================================
   2. VALEURS INITIALES — CLIENTE
   ========================================================================== */

const INITIAL_CUSTOMER:
  PublicCommandeCustomerInput =
    {
      firstName:
        "",

      lastName:
        "",

      email:
        "",

      phone:
        "",

      whatsapp:
        "",
    };


/* ==========================================================================
   3. VALEURS INITIALES — ADRESSE
   ========================================================================== */

const INITIAL_ADDRESS:
  PublicCommandeAddressInput =
    {
      countryCode:
        "",

      countryName:
        "",

      city:
        "",

      address:
        "",

      addressComplement:
        "",

      postalCode:
        "",
    };


/* ==========================================================================
   4. ÉTAT LIVRAISON INITIAL
   ========================================================================== */

const INITIAL_DELIVERY_STATE:
  PublicCommandeDeliveryState =
    {
      status:
        "IDLE",

      quote:
        null,

      message:
        null,
    };


/* ==========================================================================
   5. RÉSUMÉ INITIAL
   ========================================================================== */

const INITIAL_SUMMARY:
  PublicCommandeSummaryData =
    {
      productsSubtotal:
        null,

      delivery:
        null,

      total:
        null,
    };


/* ==========================================================================
   6. INTL DISPLAY NAMES — TYPES COMPATIBLES
   ========================================================================== */

/**
 * On évite de dépendre directement du type TypeScript Intl.DisplayNames.
 *
 * Cela protège le projet lorsqu'un tsconfig utilise encore une lib plus
 * ancienne tout en permettant aux navigateurs modernes de fournir les noms
 * localisés des pays.
 */

interface RegionDisplayNames {
  of(
    code:
      string,
  ):
    | string
    | undefined;
}


interface RegionDisplayNamesConstructor {
  new (
    locales:
      string |
      readonly string[],

    options:
      Readonly<{
        type:
          "region";
      }>,
  ):
    RegionDisplayNames;
}


/* ==========================================================================
   7. PAYS
   ========================================================================== */

function buildCountryOptions():
  readonly PublicCommandeCountryOption[] {
  const intlWithDisplayNames =
    Intl as unknown as {
      DisplayNames?:
        RegionDisplayNamesConstructor;
    };


  let displayNames:
    RegionDisplayNames |
    null =
      null;


  if (
    intlWithDisplayNames.DisplayNames
  ) {
    try {
      displayNames =
        new intlWithDisplayNames.DisplayNames(
          [
            "fr",
          ],
          {
            type:
              "region",
          },
        );
    } catch {
      displayNames =
        null;
    }
  }


  return PUBLIC_DELIVERY_COUNTRY_CODES
    .map(
      (
        code,
      ): PublicCommandeCountryOption => {
        const name =
          displayNames?.of(
            code,
          )?.trim() ||
          code;


        return {
          code,

          name,
        };
      },
    )
    .sort(
      (
        left,
        right,
      ) =>
        left.name.localeCompare(
          right.name,
          "fr",
        ),
    );
}


/* ==========================================================================
   8. SIGNATURE PANIER
   ========================================================================== */

function buildPanierSignature(
  items:
    readonly Readonly<{
      storeProductId:
        string;

      quantity:
        number;
    }>[],
): string {
  return JSON.stringify(
    items.map(
      (
        item,
      ) => [
        item.storeProductId,
        item.quantity,
      ],
    ),
  );
}


/* ==========================================================================
   9. SIGNATURE ADRESSE
   ========================================================================== */

function buildAddressSignature(
  address:
    PublicCommandeAddressInput,
): string {
  return JSON.stringify({
    countryCode:
      address.countryCode
        .trim()
        .toUpperCase(),

    countryName:
      address.countryName.trim(),

    city:
      address.city.trim(),

    address:
      address.address.trim(),

    addressComplement:
      address.addressComplement.trim(),

    postalCode:
      address.postalCode.trim(),
  });
}


/* ==========================================================================
   10. SIGNATURE CHECKOUT COMPLET
   ========================================================================== */

function buildPreparationSignature(
  input:
    PublicCommandePrepareInput,
): string {
  return JSON.stringify(
    input,
  );
}


/* ==========================================================================
   11. ADRESSE MINIMALEMENT COMPLÈTE
   ========================================================================== */

/**
 * Il ne s'agit PAS de la validation métier définitive.
 *
 * Cette fonction sert uniquement à éviter un appel serveur de livraison
 * alors que les champs principaux sont encore vides.
 */
function hasDeliveryAddressMinimumData(
  address:
    PublicCommandeAddressInput,
): boolean {
  return (
    address.countryCode.trim().length ===
      2 &&
    address.countryName.trim().length >
      0 &&
    address.city.trim().length >
      0 &&
    address.address.trim().length >
      0 &&
    address.postalCode.trim().length >
      0
  );
}


/* ==========================================================================
   12. RÉSUMÉ DEPUIS SNAPSHOT
   ========================================================================== */

/**
 * Le montant provient du snapshot serveur.
 *
 * Aucun prix du localStorage n'est utilisé.
 */
function buildSummaryFromSnapshot(
  snapshot:
    PublicCommandeSnapshot,
): PublicCommandeSummaryData {
  const subtotal =
    snapshot.subtotals.length ===
      1
      ? snapshot.subtotals[
          0
        ] ??
        null
      : null;


  return {
    productsSubtotal:
      subtotal
        ? {
            amount:
              subtotal.amount,

            currency:
              subtotal.currency,
          }
        : null,

    delivery:
      null,

    total:
      null,
  };
}


/* ==========================================================================
   13. SCROLL VERS LE HAUT
   ========================================================================== */

function scrollPageToTop():
  void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }


  window.scrollTo({
    top:
      0,

    behavior:
      "smooth",
  });
}


/* ==========================================================================
   14. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicCommandePage() {
  const router =
    useRouter();


  const {
    state:
      panierState,
  } =
    usePublicPanier();


  /* =========================================================================
     PAYS
     ========================================================================= */

  const countryOptions =
    useMemo(
      () =>
        buildCountryOptions(),
      [],
    );


  /* =========================================================================
     FORMULAIRE CLIENTE
     ========================================================================= */

  const [
    customer,
    setCustomer,
  ] =
    useState<PublicCommandeCustomerInput>(
      INITIAL_CUSTOMER,
    );


  /* =========================================================================
     FORMULAIRE ADRESSE
     ========================================================================= */

  const [
    address,
    setAddress,
  ] =
    useState<PublicCommandeAddressInput>(
      INITIAL_ADDRESS,
    );


  /* =========================================================================
     ERREURS CHAMPS
     ========================================================================= */

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState<PublicCommandeFieldErrors>(
      {},
    );


  /* =========================================================================
     MESSAGE GLOBAL
     ========================================================================= */

  const [
    message,
    setMessage,
  ] =
    useState<
      string |
      null
    >(
      null,
    );


  /* =========================================================================
     SNAPSHOT PANIER
     ========================================================================= */

  const [
    snapshot,
    setSnapshot,
  ] =
    useState<
      PublicCommandeSnapshot |
      null
    >(
      null,
    );


  /* =========================================================================
     CHARGEMENT PANIER
     ========================================================================= */

  const [
    isLoadingPanier,
    setIsLoadingPanier,
  ] =
    useState(
      false,
    );


  /* =========================================================================
     COMPTEUR RETRY PANIER
     ========================================================================= */

  const [
    panierRefreshNonce,
    setPanierRefreshNonce,
  ] =
    useState(
      0,
    );


  /* =========================================================================
     LIVRAISON
     ========================================================================= */

  const [
    deliveryState,
    setDeliveryState,
  ] =
    useState<PublicCommandeDeliveryState>(
      INITIAL_DELIVERY_STATE,
    );


  /* =========================================================================
     RÉSUMÉ
     ========================================================================= */

  const [
    summary,
    setSummary,
  ] =
    useState<PublicCommandeSummaryData>(
      INITIAL_SUMMARY,
    );



  /* =========================================================================
     CHECKOUT PRÉPARÉ
     ========================================================================= */

  const [
    preparedCheckout,
    setPreparedCheckout,
  ] =
    useState<
      PublicCommandePreparedCheckout |
      null
    >(
      null,
    );


  const [
    preparedSignature,
    setPreparedSignature,
  ] =
    useState<
      string |
      null
    >(
      null,
    );


  /* =========================================================================
     PRÉPARATION AUTOMATIQUE
     ========================================================================= */

  const [
    isPreparingPreview,
    setIsPreparingPreview,
  ] =
    useState(
      false,
    );


  /* =========================================================================
     SOUMISSION
     ========================================================================= */

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(
      false,
    );


  /* =========================================================================
     SIGNATURE PANIER
     ========================================================================= */

  const panierSignature =
    useMemo(
      () =>
        buildPanierSignature(
          panierState.items,
        ),

      [
        panierState.items,
      ],
    );


  /* =========================================================================
     SIGNATURE ADRESSE
     ========================================================================= */

  const addressSignature =
    useMemo(
      () =>
        buildAddressSignature(
          address,
        ),

      [
        address,
      ],
    );


  /* =========================================================================
     INPUT COMPLET
     ========================================================================= */

  const preparationInput =
    useMemo<PublicCommandePrepareInput>(
      () => ({
        items:
          panierState.items.map(
            (
              item,
            ) => ({
              storeProductId:
                item.storeProductId,

              quantity:
                item.quantity,
            }),
          ),

        customer,

        address,
      }),

      [
        address,
        customer,
        panierState.items,
      ],
    );


  /* =========================================================================
     SIGNATURE PRÉPARATION
     ========================================================================= */

  const preparationSignature =
    useMemo(
      () =>
        buildPreparationSignature(
          preparationInput,
        ),

      [
        preparationInput,
      ],
    );


  /* =========================================================================
     INPUT FORMELLEMENT VALIDE
     ========================================================================= */

  const preparationInputLooksValid =
    useMemo(
      () =>
        safeParsePublicCommandePrepareInput(
          preparationInput,
        ).success,

      [
        preparationInput,
      ],
    );


  /* =========================================================================
     ÉTATS DÉRIVÉS STABLES POUR LES EFFETS
     ========================================================================= */

  /**
   * IMPORTANT :
   *
   * Les effets de livraison et de préparation ne doivent pas dépendre de
   * l'identité JavaScript complète de `snapshot`.
   *
   * preparePublicCommandeCheckout() renvoie légitimement un nouveau snapshot
   * serveur. Si l'effet de livraison dépend directement de cet objet, le simple
   * remplacement du snapshot relance le calcul de livraison, invalide le total,
   * puis relance la préparation : boucle infinie.
   *
   * On dépend donc uniquement d'états métier stables.
   */
  const snapshotIsLoaded =
    snapshot !==
    null;


  const snapshotCanPrepare =
    snapshot !==
      null &&
    snapshot.allItemsAvailable &&
    snapshot.issues.length ===
      0;


  const isPreparedForCurrentInput =
    preparedCheckout !==
      null &&
    preparedSignature ===
      preparationSignature;


  /* =========================================================================
     RECHARGEMENT SERVEUR DU PANIER
     ========================================================================= */

  useEffect(
    () => {
      if (
        !panierState.hydrated
      ) {
        return;
      }


      let cancelled =
        false;


      /**
       * React 19 / eslint react-hooks/set-state-in-effect :
       *
       * Les remises à zéro liées à la synchronisation avec le panier
       * sont volontairement différées dans une tâche navigateur.
       *
       * Cela évite les setState synchrones dans le corps de l'effet
       * tout en conservant exactement le même rôle :
       *
       * - invalider l'ancien snapshot ;
       * - invalider l'ancien calcul de livraison ;
       * - invalider l'ancienne préparation checkout ;
       * - relire ensuite le panier côté serveur.
       */
      const synchronizationTimeout =
        window.setTimeout(
          () => {
            if (
              cancelled
            ) {
              return;
            }


            if (
              panierState.items.length ===
              0
            ) {
              setIsLoadingPanier(
                false,
              );

              setSnapshot(
                null,
              );

              setSummary(
                INITIAL_SUMMARY,
              );

              setDeliveryState(
                INITIAL_DELIVERY_STATE,
              );

              setPreparedCheckout(
                null,
              );

              setPreparedSignature(
                null,
              );

              setMessage(
                null,
              );

              return;
            }


            setIsLoadingPanier(
              true,
            );

            setSnapshot(
              null,
            );

            setPreparedCheckout(
              null,
            );

            setPreparedSignature(
              null,
            );

            setDeliveryState(
              INITIAL_DELIVERY_STATE,
            );

            setSummary(
              INITIAL_SUMMARY,
            );

            setMessage(
              null,
            );


            void loadPublicCommandeForCheckout({
              items:
                panierState.items,
            })
              .then(
                (
                  result,
                ) => {
                  if (
                    cancelled
                  ) {
                    return;
                  }


                  if (
                    !result.success
                  ) {
                    setMessage(
                      result.message,
                    );

                    return;
                  }


                  setSnapshot(
                    result.data,
                  );

                  setSummary(
                    buildSummaryFromSnapshot(
                      result.data,
                    ),
                  );


                  if (
                    result.data.issues.length >
                      0 ||
                    !result.data.allItemsAvailable
                  ) {
                    setMessage(
                      "Votre panier contient un ou plusieurs articles qui doivent être vérifiés avant de continuer.",
                    );
                  }
                },
              )
              .catch(
                () => {
                  if (
                    cancelled
                  ) {
                    return;
                  }


                  setMessage(
                    "Impossible de vérifier votre panier actuellement. Réessayez dans quelques instants.",
                  );
                },
              )
              .finally(
                () => {
                  if (
                    !cancelled
                  ) {
                    setIsLoadingPanier(
                      false,
                    );
                  }
                },
              );
          },
          0,
        );


      return () => {
        cancelled =
          true;

        window.clearTimeout(
          synchronizationTimeout,
        );
      };
    },

    [
      panierRefreshNonce,
      panierSignature,
      panierState.hydrated,
      panierState.items,
    ],
  );


  /* =========================================================================
     CALCUL AUTOMATIQUE DE LIVRAISON
     ========================================================================= */

  useEffect(
    () => {
      if (
        !panierState.hydrated ||
        !snapshotIsLoaded
      ) {
        return;
      }


      if (
        !hasDeliveryAddressMinimumData(
          address,
        )
      ) {
        /**
         * Même principe que pour la synchronisation du panier :
         *
         * on diffère la remise à zéro afin de ne pas déclencher
         * de setState synchrone directement depuis le corps du useEffect.
         *
         * Les handlers de saisie appellent déjà invalidateDelivery()
         * immédiatement. Ce reset différé sert de garde supplémentaire
         * pour tous les autres chemins capables de modifier l'adresse.
         */
        const resetTimeout =
          window.setTimeout(
            () => {
              setDeliveryState(
                INITIAL_DELIVERY_STATE,
              );


              setSummary(
                (
                  current,
                ) => ({
                  productsSubtotal:
                    current.productsSubtotal,

                  delivery:
                    null,

                  total:
                    null,
                }),
              );


              setPreparedCheckout(
                null,
              );

              setPreparedSignature(
                null,
              );
            },
            0,
          );


        return () => {
          window.clearTimeout(
            resetTimeout,
          );
        };
      }


      let cancelled =
        false;


      const timeout =
        window.setTimeout(
          () => {
            setDeliveryState({
              status:
                "CALCULATING",

              quote:
                null,

              message:
                null,
            });


            setSummary(
              (
                current,
              ) => ({
                productsSubtotal:
                  current.productsSubtotal,

                delivery:
                  null,

                total:
                  null,
              }),
            );


            setPreparedCheckout(
              null,
            );

            setPreparedSignature(
              null,
            );


            void calculatePublicCommandeDeliveryAction({
              address,
            })
              .then(
                (
                  result,
                ) => {
                  if (
                    cancelled
                  ) {
                    return;
                  }


                  if (
                    !result.success
                  ) {
                    setDeliveryState({
                      status:
                        "ERROR",

                      quote:
                        null,

                      message:
                        result.message,
                    });


                    return;
                  }


                  setDeliveryState({
                    status:
                      "READY",

                    quote:
                      result.data,

                    message:
                      null,
                  });


                  setSummary(
                    (
                      current,
                    ) => ({
                      productsSubtotal:
                        current.productsSubtotal,

                      delivery: {
                        amount:
                          result.data.amount.amount,

                        currency:
                          result.data.amount.currency,
                      },

                      /**
                       * Le total reste null ici.
                       *
                       * Il sera fourni par preparePublicCommandeCheckout()
                       * après revalidation complète du serveur.
                       */
                      total:
                        null,
                    }),
                  );
                },
              )
              .catch(
                () => {
                  if (
                    cancelled
                  ) {
                    return;
                  }


                  setDeliveryState({
                    status:
                      "ERROR",

                    quote:
                      null,

                    message:
                      "Impossible de calculer les frais de livraison actuellement.",
                  });
                },
              );
          },
          450,
        );


      return () => {
        cancelled =
          true;

        window.clearTimeout(
          timeout,
        );
      };
    },

    [
      address,
      addressSignature,
      panierState.hydrated,
      snapshotIsLoaded,
    ],
  );


  /* =========================================================================
     PRÉPARATION AUTOMATIQUE DU RÉSUMÉ COMPLET
     ========================================================================= */

  useEffect(
    () => {
      if (
        !snapshotCanPrepare ||
        deliveryState.status !==
          "READY" ||
        !preparationInputLooksValid ||
        isPreparedForCurrentInput
      ) {
        return;
      }


      let cancelled =
        false;


      const currentSignature =
        preparationSignature;


      const timeout =
        window.setTimeout(
          () => {
            setIsPreparingPreview(
              true,
            );


            void preparePublicCommandeCheckout(
              preparationInput,
            )
              .then(
                (
                  result,
                ) => {
                  if (
                    cancelled
                  ) {
                    return;
                  }


                  if (
                    !result.success
                  ) {
                    /**
                     * Pendant la saisie automatique, une simple erreur
                     * formulaire ne doit pas agresser l'utilisateur.
                     *
                     * La soumission explicite affichera toutes les erreurs.
                     */
                    if (
                      result.code !==
                      "INVALID_FORM"
                    ) {
                      setMessage(
                        result.message,
                      );
                    }


                    return;
                  }


                  setPreparedCheckout(
                    result.data,
                  );

                  setPreparedSignature(
                    currentSignature,
                  );

                  setSnapshot(
                    result.data.snapshot,
                  );

                  setDeliveryState({
                    status:
                      "READY",

                    quote:
                      result.data.delivery,

                    message:
                      null,
                  });

                  setSummary(
                    result.data.summary,
                  );
                },
              )
              .catch(
                () => {
                  /**
                   * L'utilisateur pourra toujours lancer la préparation
                   * explicitement avec le bouton.
                   *
                   * On n'affiche donc pas une erreur technique agressive
                   * pendant une préparation automatique silencieuse.
                   */
                },
              )
              .finally(
                () => {
                  if (
                    !cancelled
                  ) {
                    setIsPreparingPreview(
                      false,
                    );
                  }
                },
              );
          },
          650,
        );


      return () => {
        cancelled =
          true;

        window.clearTimeout(
          timeout,
        );
      };
    },

    [
      deliveryState.status,
      isPreparedForCurrentInput,
      preparationInput,
      preparationInputLooksValid,
      preparationSignature,
      snapshotCanPrepare,
    ],
  );


  /* =========================================================================
     CUSTOMER CHANGE
     ========================================================================= */

  function handleCustomerChange(
    field:
      PublicCommandeCustomerField,

    nextValue:
      string,
  ): void {
    setCustomer(
      (
        current,
      ) => ({
        ...current,

        [field]:
          nextValue,
      }),
    );


    setFieldErrors(
      (
        current,
      ) => {
        const next =
          {
            ...current,
          };


        delete next[
          field
        ];


        return next;
      },
    );


    setMessage(
      null,
    );

    setPreparedCheckout(
      null,
    );

    setPreparedSignature(
      null,
    );
  }


  /* =========================================================================
     COUNTRY CHANGE
     ========================================================================= */

  function handleCountryChange(
    country:
      PublicCommandeCountryOption |
      null,
  ): void {
    setAddress(
      (
        current,
      ) => ({
        ...current,

        countryCode:
          country?.code ??
          "",

        countryName:
          country?.name ??
          "",
      }),
    );


    setFieldErrors(
      (
        current,
      ) => {
        const next =
          {
            ...current,
          };


        delete next.countryCode;
        delete next.countryName;


        return next;
      },
    );


    invalidateDelivery();
  }


  /* =========================================================================
     ADDRESS CHANGE
     ========================================================================= */

  function handleAddressChange(
    field:
      PublicCommandeDeliveryField,

    nextValue:
      string,
  ): void {
    setAddress(
      (
        current,
      ) => ({
        ...current,

        [field]:
          nextValue,
      }),
    );


    setFieldErrors(
      (
        current,
      ) => {
        const next =
          {
            ...current,
          };


        delete next[
          field
        ];


        return next;
      },
    );


    invalidateDelivery();
  }


  /* =========================================================================
     INVALIDATION LIVRAISON
     ========================================================================= */

  function invalidateDelivery():
    void {
    setDeliveryState(
      INITIAL_DELIVERY_STATE,
    );


    setSummary(
      (
        current,
      ) => ({
        productsSubtotal:
          current.productsSubtotal,

        delivery:
          null,

        total:
          null,
      }),
    );


    setPreparedCheckout(
      null,
    );

    setPreparedSignature(
      null,
    );

    setMessage(
      null,
    );
  }


  /* =========================================================================
     RETRY PANIER
     ========================================================================= */

  function handleRetryPanier():
    void {
    setMessage(
      null,
    );

    setPanierRefreshNonce(
      (
        current,
      ) =>
        current +
        1,
    );
  }


  /* =========================================================================
     STOCKAGE DU BROUILLON POUR LA PAGE PAIEMENT
     ========================================================================= */

  function persistPaymentDraft(
    input:
      PublicCommandePrepareInput,
  ): boolean {
    try {
      const draft:
        PublicCommandeBrowserDraft =
          {
            version:
              1,

            createdAt:
              new Date().toISOString(),

            input,
          };


      window.sessionStorage.setItem(
        PUBLIC_COMMANDE_PAYMENT_DRAFT_STORAGE_KEY,
        JSON.stringify(
          draft,
        ),
      );


      return true;
    } catch {
      return false;
    }
  }


  /* =========================================================================
     SUBMIT
     ========================================================================= */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();


    if (
      isSubmitting
    ) {
      return;
    }


    setMessage(
      null,
    );

    setFieldErrors(
      {},
    );


    /* ----------------------------------------------------------------------
       PANIER
       ---------------------------------------------------------------------- */

    if (
      !snapshot ||
      snapshot.items.length ===
        0
    ) {
      setMessage(
        "Votre panier doit être vérifié avant de continuer.",
      );

      scrollPageToTop();

      return;
    }


    if (
      snapshot.issues.length >
        0 ||
      !snapshot.allItemsAvailable
    ) {
      setMessage(
        "Un ou plusieurs articles de votre panier ne sont plus disponibles. Vérifiez votre panier avant de continuer.",
      );

      scrollPageToTop();

      return;
    }


    /* ----------------------------------------------------------------------
       LIVRAISON
       ---------------------------------------------------------------------- */

    if (
      deliveryState.status !==
      "READY"
    ) {
      setMessage(
        "Renseignez une adresse valide et attendez le calcul des frais de livraison avant de continuer.",
      );

      scrollPageToTop();

      return;
    }


    setIsSubmitting(
      true,
    );


    try {
      /**
       * Même si une préparation automatique existe déjà, on refait
       * volontairement la préparation au clic.
       *
       * Cela réduit le risque d'utiliser un état devenu obsolète.
       */
      const result =
        await preparePublicCommandeCheckout(
          preparationInput,
        );


      if (
        !result.success
      ) {
        setFieldErrors(
          result.fieldErrors ??
          {},
        );

        setMessage(
          result.message,
        );

        scrollPageToTop();

        return;
      }


      /* --------------------------------------------------------------------
         METTRE L'UI À JOUR AVEC LA DERNIÈRE VÉRIFICATION SERVEUR
         -------------------------------------------------------------------- */

      setPreparedCheckout(
        result.data,
      );

      setPreparedSignature(
        preparationSignature,
      );

      setSnapshot(
        result.data.snapshot,
      );

      setDeliveryState({
        status:
          "READY",

        quote:
          result.data.delivery,

        message:
          null,
      });

      setSummary(
        result.data.summary,
      );


      /* --------------------------------------------------------------------
         BROUILLON INTER-ROUTES
         -------------------------------------------------------------------- */

      const draftStored =
        persistPaymentDraft(
          preparationInput,
        );


      if (
        !draftStored
      ) {
        setMessage(
          "Impossible de préparer temporairement vos informations pour l’étape de paiement. Veuillez réessayer.",
        );

        scrollPageToTop();

        return;
      }


      /* --------------------------------------------------------------------
         NAVIGATION
         -------------------------------------------------------------------- */

      router.push(
        generalAppRoutes.checkoutPayment,
      );
    } catch {
      setMessage(
        "Impossible de préparer votre commande actuellement. Réessayez dans quelques instants.",
      );

      scrollPageToTop();
    } finally {
      setIsSubmitting(
        false,
      );
    }
  }


  /* =========================================================================
     ÉTATS DÉRIVÉS
     ========================================================================= */

  const panierIsEmpty =
    panierState.hydrated &&
    panierState.items.length ===
      0;


  const panierHasIssues =
    snapshot
      ? (
          snapshot.issues.length >
            0 ||
          !snapshot.allItemsAvailable
        )
      : false;


  const canSubmit =
    panierState.hydrated &&
    snapshot !==
      null &&
    !panierHasIssues &&
    deliveryState.status ===
      "READY" &&
    !isLoadingPanier &&
    !isSubmitting;


  /* =========================================================================
     HYDRATATION
     ========================================================================= */

  if (
    !panierState.hydrated
  ) {
    return (
      <main
        className={
          styles.commandePage
        }
        data-public-commande-page="true"
      >
        <div
          className={
            styles.commandePageLoading
          }
          aria-live="polite"
        >
          <LoaderCircle
            className={
              styles.commandeSpinner
            }
            size={
              30
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
          />

          <strong>
            Chargement de votre commande…
          </strong>
        </div>
      </main>
    );
  }


  /* =========================================================================
     PANIER VIDE
     ========================================================================= */

  if (
    panierIsEmpty
  ) {
    return (
      <main
        className={
          styles.commandePage
        }
        data-public-commande-page="true"
      >
        <div
          className={
            styles.commandeEmpty
          }
        >
          <div
            className={
              styles.commandeEmptyIcon
            }
            aria-hidden="true"
          >
            <ShoppingBag
              size={
                36
              }
              strokeWidth={
                1.5
              }
            />
          </div>


          <h1>
            Votre panier est vide
          </h1>


          <p>
            Ajoutez au moins un produit avant de commencer
            votre commande.
          </p>


          <Link
            href={
              generalAppRoutes.products
            }
            className={
              styles.commandePrimaryButton
            }
          >
            Découvrir les produits

            <ArrowRight
              size={
                18
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
            />
          </Link>
        </div>
      </main>
    );
  }


  /* =========================================================================
     PAGE
     ========================================================================= */

  return (
    <main
      className={
        styles.commandePage
      }
      data-public-commande-page="true"
    >
      <div
        className={
          styles.commandeContainer
        }
      >
        {/* ==================================================================
            RETOUR
            ================================================================== */}

        <div
          className={
            styles.commandeBackRow
          }
        >
          <Link
            href={
              generalAppRoutes.cart
            }
            className={
              styles.commandeBackLink
            }
          >
            <ArrowLeft
              size={
                17
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
            />

            Retour au panier
          </Link>
        </div>


        {/* ==================================================================
            HERO
            ================================================================== */}

        <header
          className={
            styles.commandePageHeader
          }
        >
          <div
            className={
              styles.commandePageHeaderContent
            }
          >
            <p
              className={
                styles.commandePageEyebrow
              }
            >
              Finalisation de la commande
            </p>


            <h1
              className={
                styles.commandePageTitle
              }
            >
              Informations et livraison
            </h1>


            <p
              className={
                styles.commandePageDescription
              }
            >
              Vérifiez votre panier, renseignez vos coordonnées
              et votre adresse de livraison avant de continuer
              vers le paiement.
            </p>
          </div>


          <div
            className={
              styles.commandePageSecurity
            }
          >
            <ShieldCheck
              size={
                20
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
            />

            <div>
              <strong>
                Vérification serveur
              </strong>

              <span>
                Prix, stock et livraison sont revérifiés avant
                l’étape suivante.
              </span>
            </div>
          </div>
        </header>


        {/* ==================================================================
            MESSAGE GLOBAL
            ================================================================== */}

        {message ? (
          <div
            className={
              styles.commandeGlobalAlert
            }
            role="alert"
          >
            <CircleAlert
              size={
                20
              }
              strokeWidth={
                1.9
              }
              aria-hidden="true"
            />

            <div>
              <strong>
                Vérification nécessaire
              </strong>

              <p>
                {message}
              </p>
            </div>
          </div>
        ) : null}


        {/* ==================================================================
            CHARGEMENT SNAPSHOT
            ================================================================== */}

        {isLoadingPanier ? (
          <div
            className={
              styles.commandePanierLoading
            }
            aria-live="polite"
          >
            <LoaderCircle
              className={
                styles.commandeSpinner
              }
              size={
                21
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
            />

            Vérification du panier…
          </div>
        ) : null}


        {/* ==================================================================
            ERREUR SNAPSHOT
            ================================================================== */}

        {!isLoadingPanier &&
        !snapshot ? (
          <section
            className={
              styles.commandeLoadError
            }
          >
            <CircleAlert
              size={
                28
              }
              strokeWidth={
                1.7
              }
              aria-hidden="true"
            />


            <div>
              <h2>
                Impossible de charger votre panier
              </h2>

              <p>
                Relancez la vérification avant de continuer.
              </p>
            </div>


            <button
              type="button"
              className={
                styles.commandeSecondaryButton
              }
              onClick={
                handleRetryPanier
              }
            >
              <RefreshCcw
                size={
                  17
                }
                strokeWidth={
                  1.8
                }
                aria-hidden="true"
              />

              Réessayer
            </button>
          </section>
        ) : null}


        {/* ==================================================================
            FORMULAIRE + SUMMARY
            ================================================================== */}

        {snapshot ? (
          <form
            className={
              styles.commandeForm
            }
            onSubmit={
              handleSubmit
            }
            noValidate={
              true
            }
          >
            <div
              className={
                styles.commandeLayout
              }
            >
              {/* ============================================================
                  COLONNE FORMULAIRE
                  ============================================================ */}

              <div
                className={
                  styles.commandeMainColumn
                }
              >
                <PublicCommandeCustomerSection
                  value={
                    customer
                  }
                  errors={
                    fieldErrors
                  }
                  disabled={
                    isSubmitting
                  }
                  onChange={
                    handleCustomerChange
                  }
                />


                <PublicCommandeDeliverySection
                  value={
                    address
                  }
                  countryOptions={
                    countryOptions
                  }
                  errors={
                    fieldErrors
                  }
                  deliveryState={
                    deliveryState
                  }
                  disabled={
                    isSubmitting
                  }
                  onCountryChange={
                    handleCountryChange
                  }
                  onChange={
                    handleAddressChange
                  }
                />


                {/* ==========================================================
                    PANIER NON VALIDE
                    ========================================================== */}

                {panierHasIssues ? (
                  <div
                    className={
                      styles.commandeBlockingAlert
                    }
                    role="alert"
                  >
                    <CircleAlert
                      size={
                        21
                      }
                      strokeWidth={
                        1.9
                      }
                      aria-hidden="true"
                    />

                    <div>
                      <strong>
                        Votre panier doit être corrigé
                      </strong>

                      <p>
                        Un ou plusieurs articles ne peuvent plus
                        être commandés dans leur état actuel.
                      </p>

                      <Link
                        href={
                          generalAppRoutes.cart
                        }
                        className={
                          styles.commandeInlineLink
                        }
                      >
                        Modifier mon panier
                      </Link>
                    </div>
                  </div>
                ) : null}


                {/* ==========================================================
                    ACTION
                    ========================================================== */}

                <div
                  className={
                    styles.commandeActions
                  }
                >
                  <button
                    type="submit"
                    className={
                      styles.commandeContinueButton
                    }
                    disabled={
                      !canSubmit
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle
                          className={
                            styles.commandeSpinner
                          }
                          size={
                            19
                          }
                          strokeWidth={
                            1.8
                          }
                          aria-hidden="true"
                        />

                        Vérification en cours…
                      </>
                    ) : (
                      <>
                        <span>
                          Continuer vers le paiement
                        </span>

                        <ArrowRight
                          size={
                            19
                          }
                          strokeWidth={
                            1.9
                          }
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </button>


                  <div
                    className={
                      styles.commandeActionSecurity
                    }
                  >
                    <LockKeyhole
                      size={
                        15
                      }
                      strokeWidth={
                        1.8
                      }
                      aria-hidden="true"
                    />

                    <span>
                      Aucun paiement n’est effectué à cette étape.
                    </span>
                  </div>
                </div>
              </div>


              {/* ============================================================
                  COLONNE RÉSUMÉ
                  ============================================================ */}

              <div
                className={
                  styles.commandeSummaryColumn
                }
              >
                <PublicCommandeSummary
                  snapshot={
                    snapshot
                  }
                  summary={
                    summary
                  }
                  deliveryState={
                    deliveryState
                  }
                  disabled={
                    isSubmitting
                  }
                />


                {/* ==========================================================
                    ÉTAT SERVEUR PRÉPARÉ
                    ========================================================== */}

                {isPreparingPreview ? (
                  <div
                    className={
                      styles.commandePreparationStatus
                    }
                    aria-live="polite"
                  >
                    <LoaderCircle
                      className={
                        styles.commandeSpinner
                      }
                      size={
                        16
                      }
                      strokeWidth={
                        1.8
                      }
                      aria-hidden="true"
                    />

                    Vérification du total…
                  </div>
                ) : isPreparedForCurrentInput ? (
                  <div
                    className={
                      styles.commandePreparationReady
                    }
                  >
                    <PackageCheck
                      size={
                        17
                      }
                      strokeWidth={
                        1.8
                      }
                      aria-hidden="true"
                    />

                    <span>
                      Résumé vérifié côté serveur.
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </form>
        ) : null}
      </div>
    </main>
  );
}