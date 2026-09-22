

import Image from "next/image";

import {
  CircleAlert,
  ImageOff,
  MapPin,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";

import type {
  PublicCommandeDeliveryState,
  PublicCommandeMoney,
  PublicCommandeSnapshot,
  PublicCommandeSummary,
  PublicCommandeValidatedItem,
} from "@/lib/public/commande/public-commande-types";

import styles from "./public-commande.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — RÉSUMÉ DE COMMANDE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/commande/PublicCommandeSummary.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher le résumé commercial du checkout sur :
 *
 * /commande
 *
 * ============================================================================
 *
 * CE COMPOSANT AFFICHE :
 *
 * - les produits réellement relus côté serveur ;
 * - l'image réelle du produit ;
 * - le nom ;
 * - le SKU lorsque disponible ;
 * - la boutique ;
 * - la localisation ;
 * - la quantité ;
 * - le prix unitaire ;
 * - le sous-total de chaque ligne ;
 * - le sous-total général ;
 * - les frais de livraison ;
 * - le total final.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce composant NE CALCULE JAMAIS :
 *
 * - le prix ;
 * - le stock ;
 * - le sous-total ;
 * - les frais de livraison ;
 * - le total.
 *
 * ============================================================================
 *
 * Toutes les données financières affichées proviennent des contrats
 * serveur préparés par :
 *
 * public-commande-query.ts
 *
 * public-commande-delivery.ts
 *
 * public-commande-actions.ts
 *
 * ============================================================================
 *
 * CE COMPOSANT NE :
 *
 * - lit pas localStorage ;
 * - n'appelle pas Prisma ;
 * - n'interroge pas PostgreSQL ;
 * - ne crée aucune commande ;
 * - ne crée aucun paiement ;
 * - ne réserve aucun stock ;
 * - n'envoie aucun e-mail ;
 * - ne génère aucun PDF.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. PROPS
   ========================================================================== */

export interface PublicCommandeSummaryProps {
  /**
   * Snapshot réel du Panier rechargé côté serveur.
   */
  readonly snapshot:
    PublicCommandeSnapshot;


  /**
   * Résumé financier déjà calculé côté serveur.
   */
  readonly summary:
    PublicCommandeSummary;


  /**
   * État courant du calcul de livraison.
   */
  readonly deliveryState?:
    PublicCommandeDeliveryState;


  /**
   * Désactive visuellement certaines interactions futures.
   *
   * Le résumé actuel reste uniquement informatif.
   */
  readonly disabled?:
    boolean;
}


/* ==========================================================================
   2. NORMALISATION DEVISE
   ========================================================================== */

function normalizeCurrency(
  currency:
    string,
): string {
  return currency
    .trim()
    .toUpperCase();
}


/* ==========================================================================
   3. FORMATAGE MONÉTAIRE
   ========================================================================== */

/**
 * FORMATAGE UNIQUEMENT.
 *
 * ============================================================================
 *
 * Cette fonction n'est jamais utilisée pour :
 *
 * - additionner ;
 * - soustraire ;
 * - comparer ;
 * - recalculer.
 *
 * ============================================================================
 */
function formatMoney(
  money:
    PublicCommandeMoney,
): string {
  const currency =
    normalizeCurrency(
      money.currency,
    );


  const numericAmount =
    Number(
      money.amount,
    );


  if (
    !Number.isFinite(
      numericAmount,
    )
  ) {
    return `${money.amount} ${currency}`.trim();
  }


  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style:
          "currency",

        currency,

        currencyDisplay:
          "code",

        minimumFractionDigits:
          Number.isInteger(
            numericAmount,
          )
            ? 0
            : 2,

        maximumFractionDigits:
          2,
      },
    ).format(
      numericAmount,
    );
  } catch {
    return `${numericAmount.toLocaleString(
      "fr-FR",
    )} ${currency}`.trim();
  }
}


/* ==========================================================================
   4. FORMATAGE QUANTITÉ
   ========================================================================== */

function formatQuantity(
  quantity:
    number,
): string {
  return quantity >
    1
    ? `${quantity} articles`
    : `${quantity} article`;
}


/* ==========================================================================
   5. ÉTAT PRODUIT
   ========================================================================== */

function getItemStateLabel(
  item:
    PublicCommandeValidatedItem,
): string {
  switch (
    item.state
  ) {
    case "AVAILABLE":
      return "Disponible";


    case "INSUFFICIENT_STOCK":
      return "Stock insuffisant";


    case "OUT_OF_STOCK":
      return "Rupture de stock";


    case "UNAVAILABLE":
    default:
      return "Indisponible";
  }
}


/* ==========================================================================
   6. IMAGE PRODUIT
   ========================================================================== */

interface ProductImageProps {
  readonly item:
    PublicCommandeValidatedItem;
}


function ProductImage({
  item,
}: ProductImageProps) {
  if (
    !item.image?.url
  ) {
    return (
      <div
        className={
          styles.commandeSummaryImageFallback
        }
        aria-label="Image du produit indisponible"
      >
        <ImageOff
          size={
            24
          }
          strokeWidth={
            1.6
          }
          aria-hidden="true"
        />
      </div>
    );
  }


  return (
    <div
      className={
        styles.commandeSummaryImage
      }
    >
      <Image
        src={
          item.image.url
        }
        alt={
          item.image.altText ??
          item.name
        }
        fill={
          true
        }
        sizes="80px"
        className={
          styles.commandeSummaryImageElement
        }
      />
    </div>
  );
}


/* ==========================================================================
   7. LIGNE PRODUIT
   ========================================================================== */

interface ProductSummaryItemProps {
  readonly item:
    PublicCommandeValidatedItem;
}


function ProductSummaryItem({
  item,
}: ProductSummaryItemProps) {
  const available =
    item.state ===
    "AVAILABLE";


  return (
    <article
      className={
        styles.commandeSummaryProduct
      }
      data-product-state={
        item.state
      }
    >
      {/* ------------------------------------------------------------------
          IMAGE
          ------------------------------------------------------------------ */}

      <ProductImage
        item={
          item
        }
      />


      {/* ------------------------------------------------------------------
          INFORMATIONS
          ------------------------------------------------------------------ */}

      <div
        className={
          styles.commandeSummaryProductContent
        }
      >
        <div
          className={
            styles.commandeSummaryProductTop
          }
        >
          <div
            className={
              styles.commandeSummaryProductIdentity
            }
          >
            <h3
              className={
                styles.commandeSummaryProductName
              }
            >
              {item.name}
            </h3>


            {item.sku ? (
              <p
                className={
                  styles.commandeSummaryProductSku
                }
              >
                Réf. {item.sku}
              </p>
            ) : null}
          </div>


          <strong
            className={
              styles.commandeSummaryProductSubtotal
            }
          >
            {formatMoney(
              item.subtotal,
            )}
          </strong>
        </div>


        {/* ----------------------------------------------------------------
            BOUTIQUE
            ---------------------------------------------------------------- */}

        <div
          className={
            styles.commandeSummaryProductStore
          }
        >
          <Store
            size={
              14
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
          />

          <span>
            {item.store.name}
          </span>
        </div>


        {/* ----------------------------------------------------------------
            LOCALISATION
            ---------------------------------------------------------------- */}

        <div
          className={
            styles.commandeSummaryProductLocation
          }
        >
          <MapPin
            size={
              14
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
          />

          <span>
            {item.store.city}
            {item.store.country
              ? `, ${item.store.country}`
              : ""}
          </span>
        </div>


        {/* ----------------------------------------------------------------
            QUANTITÉ / PRIX
            ---------------------------------------------------------------- */}

        <div
          className={
            styles.commandeSummaryProductMeta
          }
        >
          <span>
            Qté :{" "}
            <strong>
              {item.quantity}
            </strong>
          </span>


          <span
            aria-hidden="true"
          >
            •
          </span>


          <span>
            {formatMoney(
              item.unitPrice,
            )} / unité
          </span>
        </div>


        {/* ----------------------------------------------------------------
            DISPONIBILITÉ
            ---------------------------------------------------------------- */}

        <div
          className={
            available
              ? styles.commandeSummaryProductAvailability
              : `${styles.commandeSummaryProductAvailability} ${styles.commandeSummaryProductAvailabilityError}`
          }
        >
          {available ? (
            <PackageCheck
              size={
                14
              }
              strokeWidth={
                1.9
              }
              aria-hidden="true"
            />
          ) : (
            <CircleAlert
              size={
                14
              }
              strokeWidth={
                1.9
              }
              aria-hidden="true"
            />
          )}

          <span>
            {getItemStateLabel(
              item,
            )}
          </span>
        </div>
      </div>
    </article>
  );
}


/* ==========================================================================
   8. LIGNE FINANCIÈRE
   ========================================================================== */

interface FinancialRowProps {
  readonly label:
    string;

  readonly value:
    string;

  readonly emphasized?:
    boolean;

  readonly muted?:
    boolean;
}


function FinancialRow({
  label,
  value,
  emphasized = false,
  muted = false,
}: FinancialRowProps) {
  return (
    <div
      className={
        emphasized
          ? `${styles.commandeSummaryFinancialRow} ${styles.commandeSummaryFinancialRowTotal}`
          : styles.commandeSummaryFinancialRow
      }
      data-muted={
        muted
          ? "true"
          : "false"
      }
    >
      <span
        className={
          styles.commandeSummaryFinancialLabel
        }
      >
        {label}
      </span>


      <strong
        className={
          styles.commandeSummaryFinancialValue
        }
      >
        {value}
      </strong>
    </div>
  );
}


/* ==========================================================================
   9. TEXTE LIVRAISON
   ========================================================================== */

function getDeliveryDisplayValue(
  summary:
    PublicCommandeSummary,

  deliveryState:
    PublicCommandeDeliveryState | undefined,
): string {
  if (
    deliveryState?.status ===
    "CALCULATING"
  ) {
    return "Calcul en cours…";
  }


  if (
    deliveryState?.status ===
    "ERROR"
  ) {
    return "À recalculer";
  }


  if (
    summary.delivery
  ) {
    return formatMoney(
      summary.delivery,
    );
  }


  return "À calculer";
}


/* ==========================================================================
   10. MESSAGE LIVRAISON
   ========================================================================== */

function DeliveryInformation({
  deliveryState,
}: Readonly<{
  deliveryState:
    PublicCommandeDeliveryState | undefined;
}>) {
  if (
    !deliveryState ||
    deliveryState.status ===
      "IDLE"
  ) {
    return (
      <div
        className={
          styles.commandeSummaryDeliveryNotice
        }
      >
        <Truck
          size={
            17
          }
          strokeWidth={
            1.8
          }
          aria-hidden="true"
        />

        <span>
          Les frais de livraison seront calculés après
          la saisie de votre adresse.
        </span>
      </div>
    );
  }


  if (
    deliveryState.status ===
    "CALCULATING"
  ) {
    return (
      <div
        className={
          styles.commandeSummaryDeliveryNotice
        }
        aria-live="polite"
      >
        <Truck
          size={
            17
          }
          strokeWidth={
            1.8
          }
          aria-hidden="true"
        />

        <span>
          Calcul des frais de livraison en cours…
        </span>
      </div>
    );
  }


  if (
    deliveryState.status ===
    "ERROR"
  ) {
    return (
      <div
        className={
          `${styles.commandeSummaryDeliveryNotice} ${styles.commandeSummaryDeliveryNoticeError}`
        }
        role="alert"
      >
        <CircleAlert
          size={
            17
          }
          strokeWidth={
            1.9
          }
          aria-hidden="true"
        />

        <span>
          {deliveryState.message}
        </span>
      </div>
    );
  }


  return (
    <div
      className={
        `${styles.commandeSummaryDeliveryNotice} ${styles.commandeSummaryDeliveryNoticeReady}`
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
        Livraison calculée pour{" "}
        <strong>
          {deliveryState.quote.countryName}
        </strong>.
      </span>
    </div>
  );
}


/* ==========================================================================
   11. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicCommandeSummary({
  snapshot,
  summary,
  deliveryState,
  disabled = false,
}: PublicCommandeSummaryProps) {
  const hasItems =
    snapshot.items.length >
    0;


  const hasIssues =
    snapshot.issues.length >
    0;


  const totalReady =
    summary.total !==
    null;


  return (
    <aside
      className={
        styles.commandeSummary
      }
      aria-labelledby="public-commande-summary-title"
      data-disabled={
        disabled
          ? "true"
          : "false"
      }
      data-public-commande-summary="true"
    >
      {/* ====================================================================
          HEADER
          ==================================================================== */}

      <div
        className={
          styles.commandeSummaryHeader
        }
      >
        <div
          className={
            styles.commandeSummaryHeaderIcon
          }
          aria-hidden="true"
        >
          <ReceiptText
            size={
              21
            }
            strokeWidth={
              1.8
            }
          />
        </div>


        <div>
          <p
            className={
              styles.commandeSummaryEyebrow
            }
          >
            Votre achat
          </p>

          <h2
            id="public-commande-summary-title"
            className={
              styles.commandeSummaryTitle
            }
          >
            Résumé de la commande
          </h2>
        </div>
      </div>


      {/* ====================================================================
          NOMBRE D'ARTICLES
          ==================================================================== */}

      <div
        className={
          styles.commandeSummaryCount
        }
      >
        <ShoppingBag
          size={
            17
          }
          strokeWidth={
            1.8
          }
          aria-hidden="true"
        />

        <span>
          {formatQuantity(
            snapshot.totalQuantity,
          )}
        </span>
      </div>


      {/* ====================================================================
          PRODUITS
          ==================================================================== */}

      {hasItems ? (
        <div
          className={
            styles.commandeSummaryProducts
          }
        >
          {snapshot.items.map(
            (
              item,
            ) => (
              <ProductSummaryItem
                key={
                  item.storeProductId
                }
                item={
                  item
                }
              />
            ),
          )}
        </div>
      ) : (
        <div
          className={
            styles.commandeSummaryEmpty
          }
        >
          <ShoppingBag
            size={
              28
            }
            strokeWidth={
              1.5
            }
            aria-hidden="true"
          />

          <p>
            Aucun article à afficher.
          </p>
        </div>
      )}


      {/* ====================================================================
          PROBLÈMES DU PANIER
          ==================================================================== */}

      {hasIssues ? (
        <div
          className={
            styles.commandeSummaryIssues
          }
          role="alert"
        >
          <CircleAlert
            size={
              18
            }
            strokeWidth={
              1.9
            }
            aria-hidden="true"
          />

          <div>
            <strong>
              Votre panier doit être vérifié
            </strong>

            {snapshot.issues.map(
              (
                issue,
              ) => (
                <p
                  key={
                    `${issue.storeProductId}-${issue.code}`
                  }
                >
                  {issue.message}
                </p>
              ),
            )}
          </div>
        </div>
      ) : null}


      {/* ====================================================================
          LIVRAISON
          ==================================================================== */}

      <DeliveryInformation
        deliveryState={
          deliveryState
        }
      />


      {/* ====================================================================
          TOTAUX
          ==================================================================== */}

      <div
        className={
          styles.commandeSummaryFinancial
        }
      >
        <FinancialRow
          label="Sous-total produits"
          value={
            summary.productsSubtotal
              ? formatMoney(
                  summary.productsSubtotal,
                )
              : "À vérifier"
          }
          muted={
            summary.productsSubtotal ===
            null
          }
        />


        <FinancialRow
          label="Livraison"
          value={
            getDeliveryDisplayValue(
              summary,
              deliveryState,
            )
          }
          muted={
            summary.delivery ===
            null
          }
        />


        <div
          className={
            styles.commandeSummaryFinancialDivider
          }
          aria-hidden="true"
        />


        <FinancialRow
          label="Total"
          value={
            summary.total
              ? formatMoney(
                  summary.total,
                )
              : "À calculer"
          }
          emphasized={
            true
          }
          muted={
            !totalReady
          }
        />
      </div>


      {/* ====================================================================
          INFORMATION FINALE
          ==================================================================== */}

      {!totalReady ? (
        <p
          className={
            styles.commandeSummaryTotalNotice
          }
        >
          Le total final sera disponible après validation
          de l’adresse et calcul des frais de livraison.
        </p>
      ) : null}
    </aside>
  );
}