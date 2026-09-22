import Link from "next/link";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import {
  getManagerCustomerStatusLabel,
  type ManagerClientAddress,
  type ManagerClientDetail,
  type ManagerClientMoney,
  type ManagerClientSpendingByCurrency,
} from "@/lib/gestionnaire/clients/client-types";

import styles from "@/app/gestionnaire/(espace-prive)/clients/clients.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — DÉTAIL CLIENT
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/clients/ClientDetailView.tsx
 *
 * Route :
 *
 * /gestionnaire/clients/[clientId]
 *
 * RÔLE :
 *
 * Afficher en lecture seule les informations d'un client autorisé :
 *
 * - identité ;
 * - contact ;
 * - statut ;
 * - ville ;
 * - nombre de commandes ;
 * - montant réellement dépensé ;
 * - première commande ;
 * - dernière commande ;
 * - adresses ;
 * - historique des commandes appartenant au store courant.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne reçoit aucun storeId ;
 * - ne reçoit aucun managerId ;
 * - ne modifie aucun client ;
 * - ne supprime aucun client ;
 * - ne crée aucun client ;
 * - ne contient aucune fausse donnée ;
 * - ne mélange jamais plusieurs devises ;
 * - n'affiche aucune photo fictive.
 *
 * La vérification d'accès appartient exclusivement à :
 *
 * getManagerClientDetail()
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES
   ========================================================================== */

const CLIENTS_ROUTE =
  "/gestionnaire/clients";


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface ClientDetailViewProps {
  readonly client:
    ManagerClientDetail;
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
   FORMAT DECIMAL
   ========================================================================== */

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


  const decimals =
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


  if (
    decimals ===
      "00"
  ) {
    return `${sign}${groupedInteger}`;
  }


  return `${sign}${groupedInteger},${decimals}`;
}


/* ==========================================================================
   MONEY
   ========================================================================== */

function formatMoney(
  money:
    ManagerClientMoney,
): string {
  return `${formatDecimalAmount(
    money.amount,
  )} ${money.currency}`;
}


function formatSpending(
  money:
    ManagerClientSpendingByCurrency,
): string {
  return `${formatDecimalAmount(
    money.amount,
  )} ${money.currency}`;
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


const DATE_TIME_FORMATTER =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

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
    string | null,
): Date | null {
  if (
    !value
  ) {
    return null;
  }


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


function formatDate(
  value:
    string | null,
): string {
  const date =
    parseDate(
      value,
    );


  if (
    !date
  ) {
    return "—";
  }


  return DATE_FORMATTER.format(
    date,
  );
}


function formatDateTime(
  value:
    string | null,
): string {
  const date =
    parseDate(
      value,
    );


  if (
    !date
  ) {
    return "—";
  }


  return DATE_TIME_FORMATTER.format(
    date,
  );
}


/* ==========================================================================
   NOM
   ========================================================================== */

function getClientFullName(
  client:
    ManagerClientDetail,
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
   INITIALES
   ========================================================================== */

function getClientInitials(
  client:
    ManagerClientDetail,
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


  return `${firstInitial}${lastInitial}` ||
    "—";
}


/* ==========================================================================
   STATUT CLIENT
   ========================================================================== */

function getClientStatusLabel(
  client:
    ManagerClientDetail,
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


function getClientStatusClassName(
  client:
    ManagerClientDetail,
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
   STATUT COMMANDE
   ========================================================================== */

function getOrderStatusLabel(
  status:
    ManagerClientDetail["orders"][number]["status"],
): string {
  switch (
    status
  ) {
    case "PENDING":
      return "En attente";

    case "CONFIRMED":
      return "Confirmée";

    case "PROCESSING":
      return "En traitement";

    case "READY":
      return "À préparer";

    case "SHIPPED":
      return "Expédiée";

    case "DELIVERED":
      return "Livrée";

    case "CANCELLED":
      return "Annulée";

    case "REFUNDED":
      return "Remboursée";
  }
}


/* ==========================================================================
   TYPE ADRESSE
   ========================================================================== */

function getAddressTypeLabel(
  address:
    ManagerClientAddress,
): string {
  switch (
    address.type
  ) {
    case "SHIPPING":
      return "Livraison";

    case "BILLING":
      return "Facturation";

    case "OTHER":
      return "Autre";
  }
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
          styles.clientDetailEmptyValue
        }
      >
        —
      </span>
    );
  }


  return (
    <div
      className={
        styles.clientDetailMoneyList
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
              styles.clientDetailMoneyValue
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
   INFORMATION SIMPLE
   ========================================================================== */

interface ClientInformationRowProps {
  readonly icon:
    React.ReactNode;

  readonly label:
    string;

  readonly value:
    string | null | undefined;
}


function ClientInformationRow({
  icon,
  label,
  value,
}: ClientInformationRowProps) {
  const displayValue =
    value?.trim() ||
    "—";


  return (
    <div
      className={
        styles.clientDetailInfoRow
      }
    >
      <div
        className={
          styles.clientDetailInfoIcon
        }
        aria-hidden="true"
      >
        {icon}
      </div>


      <div
        className={
          styles.clientDetailInfoContent
        }
      >
        <span
          className={
            styles.clientDetailInfoLabel
          }
        >
          {label}
        </span>


        <span
          className={
            styles.clientDetailInfoValue
          }
        >
          {displayValue}
        </span>
      </div>
    </div>
  );
}


/* ==========================================================================
   HEADER
   ========================================================================== */

function ClientDetailHeader({
  client,
}: {
  readonly client:
    ManagerClientDetail;
}) {
  const fullName =
    getClientFullName(
      client,
    );


  return (
    <header
      className={
        styles.clientDetailHeader
      }
    >
      <nav
        className={
          styles.clientsBreadcrumb
        }
        aria-label="Fil d’Ariane"
      >
        <Link
          href={
            CLIENTS_ROUTE
          }
          className={
            styles.clientsBreadcrumbLink
          }
        >
          Clients
        </Link>


        <span
          className={
            styles.clientsBreadcrumbSeparator
          }
          aria-hidden="true"
        >
          /
        </span>


        <span
          className={
            styles.clientsBreadcrumbCurrent
          }
          aria-current="page"
        >
          {fullName}
        </span>
      </nav>


      <div
        className={
          styles.clientDetailHeaderRow
        }
      >
        <div
          className={
            styles.clientDetailHeaderIdentity
          }
        >
          <div
            className={
              styles.clientDetailAvatar
            }
            aria-hidden="true"
          >
            {getClientInitials(
              client,
            )}
          </div>


          <div
            className={
              styles.clientDetailHeaderText
            }
          >
            <h1
              className={
                styles.clientDetailTitle
              }
            >
              {fullName}
            </h1>


            <p
              className={
                styles.clientDetailSubtitle
              }
            >
              Informations et historique commercial dans votre boutique.
            </p>
          </div>
        </div>


        <Link
          href={
            CLIENTS_ROUTE
          }
          className={
            styles.clientDetailBackButton
          }
        >
          <ArrowLeft
            size={17}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <span>
            Retour aux clients
          </span>
        </Link>
      </div>
    </header>
  );
}


/* ==========================================================================
   KPI
   ========================================================================== */

function ClientDetailKpis({
  client,
}: {
  readonly client:
    ManagerClientDetail;
}) {
  return (
    <section
      className={
        styles.clientDetailKpiGrid
      }
      aria-label="Résumé du client"
    >
      <article
        className={
          styles.clientDetailKpiCard
        }
      >
        <div
          className={
            styles.clientDetailKpiIcon
          }
          aria-hidden="true"
        >
          <ShoppingBag
            size={20}
            strokeWidth={1.8}
          />
        </div>


        <div>
          <span
            className={
              styles.clientDetailKpiLabel
            }
          >
            Commandes
          </span>


          <strong
            className={
              styles.clientDetailKpiValue
            }
          >
            {formatInteger(
              client.orderCount,
            )}
          </strong>
        </div>
      </article>


      <article
        className={
          styles.clientDetailKpiCard
        }
      >
        <div
          className={
            styles.clientDetailKpiIcon
          }
          aria-hidden="true"
        >
          <CreditCard
            size={20}
            strokeWidth={1.8}
          />
        </div>


        <div>
          <span
            className={
              styles.clientDetailKpiLabel
            }
          >
            Montant total
          </span>


          <div
            className={
              styles.clientDetailKpiValue
            }
          >
            <ClientTotalSpent
              amounts={
                client.totalSpent
              }
            />
          </div>
        </div>
      </article>


      <article
        className={
          styles.clientDetailKpiCard
        }
      >
        <div
          className={
            styles.clientDetailKpiIcon
          }
          aria-hidden="true"
        >
          <CalendarDays
            size={20}
            strokeWidth={1.8}
          />
        </div>


        <div>
          <span
            className={
              styles.clientDetailKpiLabel
            }
          >
            Première commande
          </span>


          <strong
            className={
              styles.clientDetailKpiValue
            }
          >
            {formatDate(
              client.firstOrderAt,
            )}
          </strong>
        </div>
      </article>


      <article
        className={
          styles.clientDetailKpiCard
        }
      >
        <div
          className={
            styles.clientDetailKpiIcon
          }
          aria-hidden="true"
        >
          <Clock3
            size={20}
            strokeWidth={1.8}
          />
        </div>


        <div>
          <span
            className={
              styles.clientDetailKpiLabel
            }
          >
            Dernière commande
          </span>


          <strong
            className={
              styles.clientDetailKpiValue
            }
          >
            {formatDate(
              client.lastOrderAt,
            )}
          </strong>
        </div>
      </article>
    </section>
  );
}


/* ==========================================================================
   IDENTITÉ / CONTACT
   ========================================================================== */

function ClientIdentityCard({
  client,
}: {
  readonly client:
    ManagerClientDetail;
}) {
  return (
    <section
      className={
        styles.clientDetailCard
      }
      aria-labelledby="client-detail-identity-title"
    >
      <div
        className={
          styles.clientDetailCardHeader
        }
      >
        <div
          className={
            styles.clientDetailCardHeaderIcon
          }
          aria-hidden="true"
        >
          <UserRound
            size={19}
            strokeWidth={1.8}
          />
        </div>


        <div>
          <h2
            id="client-detail-identity-title"
            className={
              styles.clientDetailCardTitle
            }
          >
            Informations client
          </h2>


          <p
            className={
              styles.clientDetailCardSubtitle
            }
          >
            Identité et coordonnées enregistrées.
          </p>
        </div>
      </div>


      <div
        className={
          styles.clientDetailInfoList
        }
      >
        <ClientInformationRow
          icon={
            <UserRound
              size={17}
              strokeWidth={1.8}
            />
          }
          label="Nom complet"
          value={
            getClientFullName(
              client,
            )
          }
        />


        <ClientInformationRow
          icon={
            <Mail
              size={17}
              strokeWidth={1.8}
            />
          }
          label="E-mail"
          value={
            client.email
          }
        />


        <ClientInformationRow
          icon={
            <Phone
              size={17}
              strokeWidth={1.8}
            />
          }
          label="Téléphone"
          value={
            client.phone
          }
        />


        <ClientInformationRow
          icon={
            <MapPin
              size={17}
              strokeWidth={1.8}
            />
          }
          label="Ville"
          value={
            client.city
          }
        />


        <div
          className={
            styles.clientDetailInfoRow
          }
        >
          <div
            className={
              styles.clientDetailInfoIcon
            }
            aria-hidden="true"
          >
            <CheckCircle2
              size={17}
              strokeWidth={1.8}
            />
          </div>


          <div
            className={
              styles.clientDetailInfoContent
            }
          >
            <span
              className={
                styles.clientDetailInfoLabel
              }
            >
              Statut
            </span>


            <span
              className={[
                styles.clientsStatusBadge,
                getClientStatusClassName(
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
          </div>
        </div>


        <ClientInformationRow
          icon={
            <CalendarDays
              size={17}
              strokeWidth={1.8}
            />
          }
          label="Création du profil client"
          value={
            client.customerCreatedAt
              ? formatDate(
                  client.customerCreatedAt,
                )
              : "—"
          }
        />
      </div>
    </section>
  );
}


/* ==========================================================================
   ADRESSES
   ========================================================================== */

function ClientAddressesCard({
  addresses,
}: {
  readonly addresses:
    readonly ManagerClientAddress[];
}) {
  return (
    <section
      className={
        styles.clientDetailCard
      }
      aria-labelledby="client-detail-addresses-title"
    >
      <div
        className={
          styles.clientDetailCardHeader
        }
      >
        <div
          className={
            styles.clientDetailCardHeaderIcon
          }
          aria-hidden="true"
        >
          <MapPin
            size={19}
            strokeWidth={1.8}
          />
        </div>


        <div>
          <h2
            id="client-detail-addresses-title"
            className={
              styles.clientDetailCardTitle
            }
          >
            Adresses
          </h2>


          <p
            className={
              styles.clientDetailCardSubtitle
            }
          >
            Adresses réellement enregistrées pour ce client.
          </p>
        </div>
      </div>


      {addresses.length >
      0 ? (
        <div
          className={
            styles.clientDetailAddressList
          }
        >
          {addresses.map(
            (
              address,
            ) => (
              <article
                key={
                  address.id
                }
                className={
                  styles.clientDetailAddress
                }
              >
                <div
                  className={
                    styles.clientDetailAddressHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.clientDetailAddressType
                      }
                    >
                      {getAddressTypeLabel(
                        address,
                      )}
                    </span>


                    {address.label && (
                      <span
                        className={
                          styles.clientDetailAddressLabel
                        }
                      >
                        {address.label}
                      </span>
                    )}
                  </div>


                  {address.isDefault && (
                    <span
                      className={
                        styles.clientDetailDefaultBadge
                      }
                    >
                      Par défaut
                    </span>
                  )}
                </div>


                <strong
                  className={
                    styles.clientDetailAddressRecipient
                  }
                >
                  {address.recipientName}
                </strong>


                <p
                  className={
                    styles.clientDetailAddressText
                  }
                >
                  {address.address}
                </p>


                <p
                  className={
                    styles.clientDetailAddressText
                  }
                >
                  {[
                    address.city,
                    address.postalCode,
                    address.country,
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(
                      ", ",
                    )}
                </p>


                {address.phone && (
                  <p
                    className={
                      styles.clientDetailAddressPhone
                    }
                  >
                    <Phone
                      size={14}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    <span>
                      {address.phone}
                    </span>
                  </p>
                )}
              </article>
            ),
          )}
        </div>
      ) : (
        <p
          className={
            styles.clientDetailEmptyText
          }
        >
          Aucune adresse enregistrée.
        </p>
      )}
    </section>
  );
}


/* ==========================================================================
   COMMANDES
   ========================================================================== */

function ClientOrdersCard({
  client,
}: {
  readonly client:
    ManagerClientDetail;
}) {
  return (
    <section
      className={
        styles.clientDetailOrdersSection
      }
      aria-labelledby="client-detail-orders-title"
    >
      <div
        className={
          styles.clientDetailOrdersHeader
        }
      >
        <div
          className={
            styles.clientDetailCardHeader
          }
        >
          <div
            className={
              styles.clientDetailCardHeaderIcon
            }
            aria-hidden="true"
          >
            <Package
              size={19}
              strokeWidth={1.8}
            />
          </div>


          <div>
            <h2
              id="client-detail-orders-title"
              className={
                styles.clientDetailCardTitle
              }
            >
              Commandes
            </h2>


            <p
              className={
                styles.clientDetailCardSubtitle
              }
            >
              Historique des commandes de ce client dans votre boutique.
            </p>
          </div>
        </div>


        <span
          className={
            styles.clientDetailOrdersCount
          }
        >
          {formatInteger(
            client.orderCount,
          )}{" "}
          {client.orderCount >
          1
            ? "commandes"
            : "commande"}
        </span>
      </div>


      {client.orders.length >
      0 ? (
        <div
          className={
            styles.clientDetailOrdersScroll
          }
        >
          <table
            className={
              styles.clientDetailOrdersTable
            }
          >
            <thead>
              <tr>
                <th scope="col">
                  Commande
                </th>

                <th scope="col">
                  Date
                </th>

                <th scope="col">
                  Montant
                </th>

                <th scope="col">
                  Statut
                </th>
              </tr>
            </thead>


            <tbody>
              {client.orders.map(
                (
                  order,
                ) => (
                  <tr
                    key={
                      order.id
                    }
                  >
                    <td>
                      <div
                        className={
                          styles.clientDetailOrderReference
                        }
                      >
                        <ReceiptText
                          size={16}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />

                        <span>
                          {order.orderNumber}
                        </span>
                      </div>
                    </td>


                    <td>
                      <time
                        dateTime={
                          order.createdAt
                        }
                        className={
                          styles.clientDetailOrderDate
                        }
                      >
                        {formatDateTime(
                          order.createdAt,
                        )}
                      </time>
                    </td>


                    <td
                      className={
                        styles.clientDetailOrderAmount
                      }
                    >
                      {formatMoney(
                        order.total,
                      )}
                    </td>


                    <td>
                      <span
                        className={
                          styles.clientDetailOrderStatus
                        }
                        data-status={
                          order.status
                        }
                      >
                        {getOrderStatusLabel(
                          order.status,
                        )}
                      </span>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p
          className={
            styles.clientDetailEmptyText
          }
        >
          Aucune commande disponible.
        </p>
      )}
    </section>
  );
}


/* ==========================================================================
   COMPONENT PRINCIPAL
   ========================================================================== */

export default function ClientDetailView({
  client,
}: ClientDetailViewProps) {
  return (
    <div
      className={
        styles.clientDetailView
      }
    >
      {/* ===================================================================
          HEADER
          =================================================================== */}

      <ClientDetailHeader
        client={
          client
        }
      />


      {/* ===================================================================
          KPI
          =================================================================== */}

      <ClientDetailKpis
        client={
          client
        }
      />


      {/* ===================================================================
          INFORMATIONS
          =================================================================== */}

      <div
        className={
          styles.clientDetailTwoColumns
        }
      >
        <ClientIdentityCard
          client={
            client
          }
        />


        <ClientAddressesCard
          addresses={
            client.addresses
          }
        />
      </div>


      {/* ===================================================================
          COMMANDES
          =================================================================== */}

      <ClientOrdersCard
        client={
          client
        }
      />
    </div>
  );
}