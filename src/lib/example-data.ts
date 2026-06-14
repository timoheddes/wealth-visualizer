import type { ImportResult } from "@/lib/export-import";
import {
  sourceValueAt,
  sourceValueWithMutations,
} from "@/lib/wealth-calculations";
import type { MutationLinkGroup } from "@/lib/mutation-links";
import type { Theme } from "@/lib/theme";
import type { Mutation, Source } from "@/types/wealth";

const SOURCE_IDS = {
  indexFund: "example-0001-4000-8000-000000000001",
  income: "example-0001-4000-8000-000000000002",
  home: "example-0001-4000-8000-000000000003",
  mortgage: "example-0001-4000-8000-000000000004",
} as const;

const MUTATION_IDS = {
  salary: "example-0002-4000-8000-000000000001",
  livingExpenses: "example-0002-4000-8000-000000000002",
  savingsOut: "example-0002-4000-8000-000000000003",
  savingsIn: "example-0002-4000-8000-000000000004",
  mortgagePayment: "example-0002-4000-8000-000000000005",
  sellHome: "example-0002-4000-8000-000000000006",
  saleProfit: "example-0002-4000-8000-000000000007",
  mortgagePayoff: "example-0002-4000-8000-000000000008",
} as const;

const LINK_GROUP_IDS = {
  savingsTransfer: "example-0003-4000-8000-000000000001",
  homeSale: "example-0003-4000-8000-000000000002",
} as const;

function exampleDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`);
}

export function createExampleImportResult(theme: Theme = "light"): ImportResult {
  const planStart = exampleDate("2026-06-14");
  const planEnd = exampleDate("2036-06-14");
  const saleDate = exampleDate("2031-06-14");

  const homeSource: Source = {
    id: SOURCE_IDS.home,
    type: "property",
    label: "Home",
    color: "#fd7e14",
    initialValue: 300_000,
    initialDate: planStart,
    endDate: planEnd,
    growth: 3,
  };

  const mortgageSource: Source = {
    id: SOURCE_IDS.mortgage,
    type: "debt",
    label: "Mortgage",
    color: "#be4bdb",
    initialValue: 180_000,
    initialDate: planStart,
    endDate: planEnd,
    growth: 2.5,
  };

  const sources: Source[] = [
    {
      id: SOURCE_IDS.indexFund,
      type: "investment",
      label: "Investments",
      color: "#4c6ef5",
      initialValue: 25_000,
      initialDate: planStart,
      endDate: planEnd,
      growth: 7,
    },
    {
      id: SOURCE_IDS.income,
      type: "cash",
      label: "Income",
      color: "#12b886",
      initialValue: 0,
      initialDate: planStart,
      endDate: planEnd,
      growth: 0,
    },
    homeSource,
    mortgageSource,
  ];

  // Sale price at the sale date (grown property value). The sell mutation
  // removes the home line; sale proceeds deposit that cash into investments.
  const saleProceeds = Math.round(sourceValueAt(homeSource, saleDate));

  const mutationsBeforePayoff: Mutation[] = [
    {
      id: MUTATION_IDS.salary,
      target: "source",
      sourceId: SOURCE_IDS.income,
      value: 3_000,
      label: "Salary",
      date: planStart,
      type: "recurring",
      frequency: 30,
      endDate: null,
      color: "#12b886",
    },
    {
      id: MUTATION_IDS.livingExpenses,
      target: "source",
      sourceId: SOURCE_IDS.income,
      value: -1_500,
      label: "Living expenses",
      date: planStart,
      type: "recurring",
      frequency: 30,
      endDate: null,
      color: "#12b886",
    },
    {
      id: MUTATION_IDS.savingsOut,
      target: "source",
      sourceId: SOURCE_IDS.income,
      value: -500,
      label: "Monthly investments",
      date: planStart,
      type: "recurring",
      frequency: 30,
      endDate: null,
      color: "#12b886",
    },
    {
      id: MUTATION_IDS.savingsIn,
      target: "source",
      sourceId: SOURCE_IDS.indexFund,
      value: 500,
      label: "Monthly investments",
      date: planStart,
      type: "recurring",
      frequency: 30,
      endDate: null,
      color: "#4c6ef5",
    },
    {
      id: MUTATION_IDS.mortgagePayment,
      target: "source",
      sourceId: SOURCE_IDS.mortgage,
      value: -900,
      label: "Mortgage payment",
      date: planStart,
      type: "recurring",
      frequency: 30,
      endDate: null,
      color: "#be4bdb",
    },
    {
      id: MUTATION_IDS.sellHome,
      target: "source",
      sourceId: SOURCE_IDS.home,
      value: -saleProceeds,
      label: "Sell home",
      date: saleDate,
      type: "once",
      frequency: 0,
      endDate: null,
      color: "#fd7e14",
    },
    {
      id: MUTATION_IDS.saleProfit,
      target: "source",
      sourceId: SOURCE_IDS.indexFund,
      value: saleProceeds,
      label: "Sale of home proceeds",
      date: saleDate,
      type: "once",
      frequency: 0,
      endDate: null,
      color: "#4c6ef5",
    },
  ];

  const mortgageBalanceAtSale = Math.round(
    sourceValueWithMutations(
      mortgageSource,
      sources,
      mutationsBeforePayoff,
      saleDate,
    ),
  );

  const mutations: Mutation[] = [
    ...mutationsBeforePayoff,
    {
      id: MUTATION_IDS.mortgagePayoff,
      target: "source",
      sourceId: SOURCE_IDS.mortgage,
      value: -mortgageBalanceAtSale,
      label: "Mortgage payoff",
      date: saleDate,
      type: "once",
      frequency: 0,
      endDate: null,
      color: "#be4bdb",
    },
  ];

  const mutationLinkGroups: MutationLinkGroup[] = [
    {
      id: LINK_GROUP_IDS.savingsTransfer,
      mutationIds: [MUTATION_IDS.savingsOut, MUTATION_IDS.savingsIn],
    },
    {
      id: LINK_GROUP_IDS.homeSale,
      mutationIds: [
        MUTATION_IDS.sellHome,
        MUTATION_IDS.saleProfit,
        MUTATION_IDS.mortgagePayoff,
      ],
    },
  ];

  const homeSaleMutationIds: Set<string> = new Set([
    MUTATION_IDS.sellHome,
    MUTATION_IDS.saleProfit,
    MUTATION_IDS.mortgagePayoff,
  ]);

  return {
    currency: "EUR",
    sources,
    mutations,
    range: { start: planStart, end: planEnd },
    theme,
    enabledSourceIds: new Set(Object.values(SOURCE_IDS)),
    enabledMutationIds: new Set(
      Object.values(MUTATION_IDS).filter((id) => !homeSaleMutationIds.has(id)),
    ),
    mutationLinkGroups,
  };
}
