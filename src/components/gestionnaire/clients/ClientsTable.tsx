import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

import {
  getManagerCustomerStatusLabel,
  type ManagerClientListItem,
  type ManagerClientSpendingByCurrency,
  type ManagerClientsFilters,
  type ManagerClientsPagination,
} from "@/lib/gestionnaire/clients/client-types";

import styles from "@/app/gestionnaire/(espace-prive)/clients/clients.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — TABLE CLIENTS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/clients/ClientsTable.tsx
 *
 * Route principale :
 *
 * /gestionnaire/clients
 *
 * Détail :
 *
 * /gestionnaire/clients/[clientId]
 *
 * RÔLE :
 *
 * Afficher les clients réels du Gestionnaire connecté avec :
 *
 * - sélection visuelle ;
 * - numéro de ligne ;
 * - identité ;
 * - contact ;
 * - ville ;
 * - nombre de commandes ;
 * - montant total réellement confirmé ;
 * - dernière commande ;
 * - statut ;
 * - action Voir ;
 * - pagination serveur.
 *
 * IMPORTANT :
 *
 * - aucune donnée fictive ;
 * - aucune requête Prisma ici ;
 * - aucun storeId venant du navigateur ;
 * - aucun managerId venant du navigateur ;
 * - aucune somme entre devises différentes ;
 * - aucune photo fictive ;
 * - aucune modification client ;
 * - aucune suppression client ;
 * - aucune création client ;
 * - aucune action de masse.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE
   ========================================================================== */

const CLIENTS_ROUTE =
  "/gestionnaire/clients";


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface ClientsTableProps {
  readonly clients:
    readonly ManagerClientListItem[];

  readonly filters:
    ManagerClientsFilters;

  readonly pagination:
    ManagerClientsPagination;
}


/* ==========================================================================
   FORMAT NOMBRE
   ========================================================================== */

const INTEGER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


function formatInteger(
  value:
    number,
): string {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return "0";
  }


  return INTEGER_FORMATTER.format(
    Math.max(
      0,
      Math.trunc(
        value,
      ),
    ),
  );
}


/* ==========================================================================
   FORMAT MONTANT
   ========================================================================== */

/**
 * Formate une valeur Decimal déjà sérialisée sous forme de string.
 *
 * On évite volontairement de convertir tout le montant en Number afin
 * de ne pas introduire inutilement de problème de précision.
 */

function formatDecimalAmount(
  rawAmount:
    string,
): string {
  const normalized =
    rawAmount
      .trim()
      .replace(
        ",",
        ".",
      );


  const match =
    /^(-?)(\d+)(?:\.(\d+))?$/.exec(
      normalized,
    );


  if (
    !match
  ) {
    return rawAmount;
  }


  const sign =
    match[1] ?? "";


  const integerPart =
    match[2] ?? "0";


  const decimalPart =
    (
      match[3] ?? ""
    )
      .slice(
        0,
        2,
      )
      .padEnd(
        2,
        "0",
      );


  const groupedInteger =
    integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      "\u202F",
    );


  const hasUsefulDecimals =
    decimalPart !==
      "00";


  if (
    !hasUsefulDecimals
  ) {
    return `${sign}${groupedInteger}`;
  }


  return `${sign}${groupedInteger},${decimalPart}`;
}


/* ==========================================================================
   FORMAT TOTAL DÉPENSÉ
   ========================================================================== */

function formatSpending(
  spending:
    ManagerClientSpendingByCurrency,
): string {
  return `${formatDecimalAmount(
    spending.amount,
  )} ${spending.currency}`;
}


/* ==========================================================================
   DATE
   ========================================================================== */

const DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    },
  );


const TIME_FORMATTER =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false,
    },
  );


function parseDate(
  value:
    string,
): Date | null {
  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }


  return date;
}


/* ==========================================================================
   INITIALES
   ========================================================================== */

/**
 * Aucun champ avatar n'existe actuellement sur Customer.
 *
 * On utilise donc uniquement les initiales.
 */

function getClientInitials(
  client:
    ManagerClientListItem,
): string {
  const firstInitial =
    client.firstName
      .trim()
      .charAt(
        0,
      )
      .toUpperCase();


  const lastInitial =
    client.lastName
      .trim()
      .charAt(
        0,
      )
      .toUpperCase();


  const initials =
    `${firstInitial}${lastInitial}`;


  return initials ||
    "—";
}


/* ==========================================================================
   NOM COMPLET
   ========================================================================== */

function getClientFullName(
  client:
    ManagerClientListItem,
): string {
  const fullName =
    [
      client.firstName,
      client.lastName,
    ]
      .map(
        (
          value,
        ) =>
          value.trim(),
      )
      .filter(
        Boolean,
      )
      .join(
        " ",
      );


  return fullName ||
    "Client";
}


/* ==========================================================================
   CLASSE STATUT
   ========================================================================== */

function getStatusClassName(
  client:
    ManagerClientListItem,
): string {
  switch (
    client.status
  ) {
    case "ACTIVE":
      return styles.clientsStatusActive;

    case "BLOCKED":
      return styles.clientsStatusBlocked;

    case "ARCHIVED":
      return styles.clientsStatusArchived;

    default:
      return styles.clientsStatusNeutral;
  }
}


/* ==========================================================================
   LABEL STATUT
   ========================================================================== */

function getClientStatusLabel(
  client:
    ManagerClientListItem,
): string {
  if (
    !client.status
  ) {
    return "—";
  }


  return getManagerCustomerStatusLabel(
    client.status,
  );
}


/* ==========================================================================
   QUERY PARAMS
   ========================================================================== */

function appendCurrentFilters(
  params:
    URLSearchParams,

  filters:
    ManagerClientsFilters,
): void {
  if (
    filters.q
  ) {
    params.set(
      "q",
      filters.q,
    );
  }


  if (
    filters.city
  ) {
    params.set(
      "city",
      filters.city,
    );
  }


  if (
    filters.status !==
      "all"
  ) {
    params.set(
      "status",
      filters.status,
    );
  }


  if (
    filters.sort !==
      "last-order-desc"
  ) {
    params.set(
      "sort",
      filters.sort,
    );
  }
}


/* ==========================================================================
   LIEN PAGINATION
   ========================================================================== */

function buildPageHref(
  page:
    number,

  filters:
    ManagerClientsFilters,
): string {
  const params =
    new URLSearchParams();


  appendCurrentFilters(
    params,
    filters,
  );


  if (
    page >
      1
  ) {
    params.set(
      "page",
      String(
        page,
      ),
    );
  }


  const query =
    params.toString();


  return query
    ? `${CLIENTS_ROUTE}?${query}`
    : CLIENTS_ROUTE;
}


/* ==========================================================================
   PAGES VISIBLES
   ========================================================================== */

/**
 * Produit une pagination compacte :
 *
 * 1 2 3 ... 8
 *
 * sans créer des dizaines de boutons.
 */

function getVisiblePages(
  currentPage:
    number,

  totalPages:
    number,
): readonly (
  | number
  | "ellipsis"
)[] {
  if (
    totalPages <=
      7
  ) {
    return Array.from(
      {
        length:
          totalPages,
      },
      (
        _value,
        index,
      ) =>
        index +
        1,
    );
  }


  if (
    currentPage <=
      4
  ) {
    return [
      1,
      2,
      3,
      4,
      5,
      "ellipsis",
      totalPages,
    ];
  }


  if (
    currentPage >=
      totalPages -
        3
  ) {
    return [
      1,
      "ellipsis",
      totalPages -
        4,
      totalPages -
        3,
      totalPages -
        2,
      totalPages -
        1,
      totalPages,
    ];
  }


  return [
    1,
    "ellipsis",
    currentPage -
      1,
    currentPage,
    currentPage +
      1,
    "ellipsis",
    totalPages,
  ];
}


/* ==========================================================================
   CONTACT
   ========================================================================== */

function ClientContact({
  client,
}: {
  readonly client:
    ManagerClientListItem;
}) {
  return (
    <div
      className={
        styles.clientsContact
      }
    >
      <span
        className={
          styles.clientsContactPrimary
        }
      >
        {client.email ??
          "—"}
      </span>


      <span
        className={
          styles.clientsContactSecondary
        }
      >
        {client.phone ??
          "—"}
      </span>
    </div>
  );
}


/* ==========================================================================
   TOTAL DÉPENSÉ
   ========================================================================== */

function ClientTotalSpent({
  amounts,
}: {
  readonly amounts:
    readonly ManagerClientSpendingByCurrency[];
}) {
  if (
    amounts.length ===
      0
  ) {
    return (
      <span
        className={
          styles.clientsAmountEmpty
        }
      >
        —
      </span>
    );
  }


  return (
    <div
      className={
        styles.clientsAmounts
      }
    >
      {amounts.map(
        (
          amount,
        ) => (
          <span
            key={
              `${amount.currency}-${amount.amount}`
            }
            className={
              styles.clientsAmount
            }
          >
            {formatSpending(
              amount,
            )}
          </span>
        ),
      )}
    </div>
  );
}


/* ==========================================================================
   DERNIÈRE COMMANDE
   ========================================================================== */

function ClientLastOrder({
  value,
}: {
  readonly value:
    string;
}) {
  const date =
    parseDate(
      value,
    );


  if (
    !date
  ) {
    return (
      <span>
        —
      </span>
    );
  }


  return (
    <time
      className={
        styles.clientsLastOrder
      }
      dateTime={
        value
      }
    >
      <span
        className={
          styles.clientsLastOrderDate
        }
      >
        {DATE_FORMATTER.format(
          date,
        )}
      </span>


      <span
        className={
          styles.clientsLastOrderTime
        }
      >
        {TIME_FORMATTER.format(
          date,
        )}
      </span>
    </time>
  );
}


/* ==========================================================================
   PAGINATION
   ========================================================================== */

function ClientsPagination({
  filters,
  pagination,
}: {
  readonly filters:
    ManagerClientsFilters;

  readonly pagination:
    ManagerClientsPagination;
}) {
  if (
    pagination.totalItems ===
      0
  ) {
    return null;
  }


  const visiblePages =
    getVisiblePages(
      pagination.page,
      pagination.totalPages,
    );


  return (
    <footer
      className={
        styles.clientsTableFooter
      }
    >
      {/* =================================================================
          RÉSUMÉ
          ================================================================= */}

      <p
        className={
          styles.clientsPaginationSummary
        }
      >
        Affichage de{" "}
        <strong>
          {pagination.startItem}
        </strong>{" "}
        à{" "}
        <strong>
          {pagination.endItem}
        </strong>{" "}
        sur{" "}
        <strong>
          {pagination.totalItems}
        </strong>{" "}
        clients
      </p>


      {/* =================================================================
          NAVIGATION
          ================================================================= */}

      {pagination.totalPages >
        1 && (
        <nav
          className={
            styles.clientsPagination
          }
          aria-label="Pagination des clients"
        >
          {/* =============================================================
              PRÉCÉDENT
              ============================================================= */}

          {pagination.hasPreviousPage ? (
            <Link
              href={
                buildPageHref(
                  pagination.page -
                    1,
                  filters,
                )
              }
              className={
                styles.clientsPaginationButton
              }
              aria-label="Page précédente"
            >
              <ChevronLeft
                size={17}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </Link>
          ) : (
            <span
              className={[
                styles.clientsPaginationButton,
                styles.clientsPaginationButtonDisabled,
              ].join(
                " ",
              )}
              aria-hidden="true"
            >
              <ChevronLeft
                size={17}
                strokeWidth={1.8}
              />
            </span>
          )}


          {/* =============================================================
              PAGES
              ============================================================= */}

          <div
            className={
              styles.clientsPaginationPages
            }
          >
            {visiblePages.map(
              (
                page,
                index,
              ) => {
                if (
                  page ===
                    "ellipsis"
                ) {
                  return (
                    <span
                      key={
                        `ellipsis-${index}`
                      }
                      className={
                        styles.clientsPaginationEllipsis
                      }
                      aria-hidden="true"
                    >
                      …
                    </span>
                  );
                }


                const isActive =
                  page ===
                  pagination.page;


                if (
                  isActive
                ) {
                  return (
                    <span
                      key={
                        page
                      }
                      className={[
                        styles.clientsPaginationPage,
                        styles.clientsPaginationPageActive,
                      ].join(
                        " ",
                      )}
                      aria-current="page"
                    >
                      {page}
                    </span>
                  );
                }


                return (
                  <Link
                    key={
                      page
                    }
                    href={
                      buildPageHref(
                        page,
                        filters,
                      )
                    }
                    className={
                      styles.clientsPaginationPage
                    }
                    aria-label={
                      `Aller à la page ${page}`
                    }
                  >
                    {page}
                  </Link>
                );
              },
            )}
          </div>


          {/* =============================================================
              SUIVANT
              ============================================================= */}

          {pagination.hasNextPage ? (
            <Link
              href={
                buildPageHref(
                  pagination.page +
                    1,
                  filters,
                )
              }
              className={
                styles.clientsPaginationButton
              }
              aria-label="Page suivante"
            >
              <ChevronRight
                size={17}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </Link>
          ) : (
            <span
              className={[
                styles.clientsPaginationButton,
                styles.clientsPaginationButtonDisabled,
              ].join(
                " ",
              )}
              aria-hidden="true"
            >
              <ChevronRight
                size={17}
                strokeWidth={1.8}
              />
            </span>
          )}
        </nav>
      )}
    </footer>
  );
}


/* ==========================================================================
   COMPONENT PRINCIPAL
   ========================================================================== */

export default function ClientsTable({
  clients,
  filters,
  pagination,
}: ClientsTableProps) {
  return (
    <section
      className={
        styles.clientsTableSection
      }
      aria-labelledby="clients-list-title"
    >
      {/* ===================================================================
          TITRE TABLE
          =================================================================== */}

      <div
        className={
          styles.clientsTableHeader
        }
      >
        <div>
          <h2
            id="clients-list-title"
            className={
              styles.clientsTableTitle
            }
          >
            Liste de mes clients
          </h2>


          <p
            className={
              styles.clientsTableSubtitle
            }
          >
            Clients ayant réellement passé commande dans votre boutique.
          </p>
        </div>
      </div>


      {/* ===================================================================
          TABLE DESKTOP
          =================================================================== */}

      <div
        className={
          styles.clientsTableScroll
        }
      >
        <table
          className={
            styles.clientsTable
          }
        >
          <thead>
            <tr>
              {/* ===========================================================
                  SÉLECTION
                  =========================================================== */}

              <th
                scope="col"
                className={
                  styles.clientsSelectionColumn
                }
              >
                <span
                  className={
                    styles.clientsVisuallyHidden
                  }
                >
                  Sélection
                </span>

                <input
                  type="checkbox"
                  className={
                    styles.clientsCheckbox
                  }
                  aria-label="Sélectionner tous les clients affichés"
                  disabled
                />
              </th>


              {/* ===========================================================
                  #
                  =========================================================== */}

              <th
                scope="col"
                className={
                  styles.clientsNumberColumn
                }
              >
                #
              </th>


              <th scope="col">
                Client
              </th>


              <th scope="col">
                Contact
              </th>


              <th scope="col">
                Ville
              </th>


              <th scope="col">
                Nombre de commandes
              </th>


              <th scope="col">
                Montant total
              </th>


              <th scope="col">
                Dernière commande
              </th>


              <th scope="col">
                Statut
              </th>


              <th
                scope="col"
                className={
                  styles.clientsActionsColumn
                }
              >
                Actions
              </th>
            </tr>
          </thead>


          <tbody>
            {clients.map(
              (
                client,
                index,
              ) => {
                const fullName =
                  getClientFullName(
                    client,
                  );


                const rowNumber =
                  pagination.startItem +
                  index;


                return (
                  <tr
                    key={
                      client.id
                    }
                  >
                    {/* =====================================================
                        SÉLECTION
                        ===================================================== */}

                    <td
                      className={
                        styles.clientsSelectionCell
                      }
                    >
                      <input
                        type="checkbox"
                        className={
                          styles.clientsCheckbox
                        }
                        aria-label={
                          `Sélectionner ${fullName}`
                        }
                        disabled
                      />
                    </td>


                    {/* =====================================================
                        NUMÉRO
                        ===================================================== */}

                    <td
                      className={
                        styles.clientsRowNumber
                      }
                    >
                      {rowNumber}
                    </td>


                    {/* =====================================================
                        CLIENT
                        ===================================================== */}

                    <td>
                      <div
                        className={
                          styles.clientsIdentity
                        }
                      >
                        <div
                          className={
                            styles.clientsAvatar
                          }
                          aria-hidden="true"
                        >
                          {getClientInitials(
                            client,
                          )}
                        </div>


                        <div
                          className={
                            styles.clientsIdentityText
                          }
                        >
                          <span
                            className={
                              styles.clientsName
                            }
                          >
                            {fullName}
                          </span>
                        </div>
                      </div>
                    </td>


                    {/* =====================================================
                        CONTACT
                        ===================================================== */}

                    <td>
                      <ClientContact
                        client={
                          client
                        }
                      />
                    </td>


                    {/* =====================================================
                        VILLE
                        ===================================================== */}

                    <td
                      className={
                        styles.clientsCity
                      }
                    >
                      {client.city ??
                        "—"}
                    </td>


                    {/* =====================================================
                        COMMANDES
                        ===================================================== */}

                    <td>
                      <span
                        className={
                          styles.clientsOrderCount
                        }
                      >
                        {formatInteger(
                          client.orderCount,
                        )}
                      </span>
                    </td>


                    {/* =====================================================
                        TOTAL
                        ===================================================== */}

                    <td>
                      <ClientTotalSpent
                        amounts={
                          client.totalSpent
                        }
                      />
                    </td>


                    {/* =====================================================
                        DERNIÈRE COMMANDE
                        ===================================================== */}

                    <td>
                      <ClientLastOrder
                        value={
                          client.lastOrderAt
                        }
                      />
                    </td>


                    {/* =====================================================
                        STATUT
                        ===================================================== */}

                    <td>
                      <span
                        className={[
                          styles.clientsStatusBadge,
                          getStatusClassName(
                            client,
                          ),
                        ].join(
                          " ",
                        )}
                      >
                        {getClientStatusLabel(
                          client,
                        )}
                      </span>
                    </td>


                    {/* =====================================================
                        ACTION
                        ===================================================== */}

                    <td
                      className={
                        styles.clientsActionsCell
                      }
                    >
                      {client.customerId ? (
                        <Link
                          href={
                            `/gestionnaire/clients/${encodeURIComponent(
                              client.customerId,
                            )}`
                          }
                          className={
                            styles.clientsViewButton
                          }
                          aria-label={
                            `Voir le client ${fullName}`
                          }
                        >
                          <Eye
                            size={16}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />

                          <span>
                            Voir
                          </span>
                        </Link>
                      ) : (
                        <span
                          className={[
                            styles.clientsViewButton,
                            styles.clientsViewButtonDisabled,
                          ].join(
                            " ",
                          )}
                          aria-disabled="true"
                        >
                          <Eye
                            size={16}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />

                          <span>
                            Voir
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>


      {/* ===================================================================
          PAGINATION
          =================================================================== */}

      <ClientsPagination
        filters={
          filters
        }
        pagination={
          pagination
        }
      />
    </section>
  );
}