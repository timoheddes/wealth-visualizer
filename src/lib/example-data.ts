import type { ImportResult } from "@/lib/export-import";
import type { MutationLinkGroup } from "@/lib/mutation-links";
import type { Theme } from "@/lib/theme";
import type { Mutation, Source } from "@/types/wealth";

const SOURCE_IDS = {
  indexFund: "example-0001-4000-8000-000000000001",
  income: "example-0001-4000-8000-000000000002",
  home: "example-0001-4000-8000-000000000003",
} as const;

const MUTATION_IDS = {
  salary: "example-0002-4000-8000-000000000001",
  livingExpenses: "example-0002-4000-8000-000000000002",
  savingsOut: "example-0002-4000-8000-000000000003",
  savingsIn: "example-0002-4000-8000-000000000004",
  sellHome: "example-0002-4000-8000-000000000005",
  saleProfit: "example-0002-4000-8000-000000000006",
  mortgagePayoff: "example-0002-4000-8000-000000000007",
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

  const sources: Source[] = [
    {
      id: SOURCE_IDS.indexFund,
      type: "investment",
      label: "Index fund",
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
    {
      id: SOURCE_IDS.home,
      type: "property",
      label: "Home",
      color: "#fd7e14",
      initialValue: 300_000,
      initialDate: planStart,
      endDate: saleDate,
      growth: 3,
    },
  ];

  const mutations: Mutation[] = [
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
      label: "Monthly savings",
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
      label: "Monthly savings",
      date: planStart,
      type: "recurring",
      frequency: 30,
      endDate: null,
      color: "#4c6ef5",
    },
    {
      id: MUTATION_IDS.sellHome,
      target: "source",
      sourceId: SOURCE_IDS.home,
      value: -300_000,
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
      value: 50_000,
      label: "Sale profit",
      date: saleDate,
      type: "once",
      frequency: 0,
      endDate: null,
      color: "#4c6ef5",
    },
    {
      id: MUTATION_IDS.mortgagePayoff,
      target: "total",
      sourceId: null,
      value: -180_000,
      label: "Mortgage payoff",
      date: saleDate,
      type: "once",
      frequency: 0,
      endDate: null,
      color: "#4c6ef5",
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

  return {
    currency: "EUR",
    sources,
    mutations,
    range: { start: planStart, end: planEnd },
    theme,
    enabledSourceIds: new Set(Object.values(SOURCE_IDS)),
    enabledMutationIds: new Set(Object.values(MUTATION_IDS)),
    mutationLinkGroups,
  };
}
