import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';
import { HttpError } from '@openshift-console/dynamic-plugin-sdk/lib/utils/error/http-error';
import { ALL_NAMESPACES_KEY, SUMMARY_FETCH_URL } from '../../consts';
import {
  DevConsoleEndpointResponse,
  SummaryRequest,
  SummaryResponse,
  TektonResultsOptions,
} from '../../types';
import { consoleProxyFetchJSON } from './proxy';
import {
  AND,
  createTektonResultsSummaryUrl,
  EQ,
  MAXIMUM_PAGE_SIZE,
  MINIMUM_PAGE_SIZE,
  selectorToFilter,
} from './tekton-results';

const generateMockSummary = (
  options?: TektonResultsOptions,
): SummaryResponse => {
  const fields = (options?.summary || '').split(',').map((s) => s.trim());
  const groupBy = options?.groupBy;

  const baseSummary: Record<string, unknown> = {};
  if (fields.includes('succeeded')) baseSummary.succeeded = 42;
  if (fields.includes('failed')) baseSummary.failed = 7;
  if (fields.includes('running')) baseSummary.running = 3;
  if (fields.includes('cancelled')) baseSummary.cancelled = 2;
  if (fields.includes('others')) baseSummary.others = 1;
  if (fields.includes('total')) baseSummary.total = 55;
  if (fields.includes('avg_duration')) baseSummary.avg_duration = '00:03:00';
  if (fields.includes('max_duration')) baseSummary.max_duration = '00:12:00';
  if (fields.includes('total_duration'))
    baseSummary.total_duration = '02:45:00';
  if (fields.includes('last_runtime'))
    baseSummary.last_runtime = Math.floor(Date.now() / 1000) - 600;

  if (!groupBy) {
    return { summary: [baseSummary] } as SummaryResponse;
  }

  if (groupBy === 'pipeline' || groupBy === 'repository') {
    const names =
      groupBy === 'pipeline'
        ? [
            'demo-ns/buildah-deploy',
            'demo-ns/docker-build-push',
            'ci-cd/s2i-java',
            'ci-cd/nodejs-deploy',
            'staging/scan-and-deploy',
          ]
        : ['demo-ns/frontend-app', 'ci-cd/backend-api', 'staging/infra-config'];
    const durations = ['00:02:00', '00:02:30', '00:03:00', '00:03:30', '00:04:00'];
    return {
      summary: names.map((name, i) => ({
        ...baseSummary,
        group_value: name,
        total: 10 + i * 3,
        succeeded: 8 + i * 2,
        failed: Math.max(0, 2 - i),
        avg_duration: durations[i] || durations[0],
        total_duration: durations[i] || durations[0],
        last_runtime: Math.floor(Date.now() / 1000) - i * 3600,
      })),
    } as SummaryResponse;
  }

  const now = new Date();
  const points: Record<string, unknown>[] = [];
  const count = groupBy === 'hour' ? 24 : groupBy === 'month' ? 12 : 7;
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    if (groupBy === 'hour') d.setHours(i, 0, 0, 0);
    else if (groupBy === 'month') d.setMonth(now.getMonth() - (count - 1 - i));
    else d.setDate(now.getDate() - (count - 1 - i));
    const t = 4 + Math.floor(Math.abs(Math.sin(i * 1.3)) * 8);
    const s = Math.floor(t * 0.75);
    points.push({
      group_value: `${Math.floor(d.getTime() / 1000)}`,
      total: t,
      succeeded: s,
      failed: Math.max(0, t - s - 1),
      cancelled: i % 5 === 0 ? 1 : 0,
      others: i % 7 === 0 ? 1 : 0,
    });
  }
  return { summary: points } as SummaryResponse;
};

export const fetchSummaryURLConfig = async (
  namespace: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
): Promise<SummaryRequest> => {
  const searchNamespace =
    namespace && namespace !== ALL_NAMESPACES_KEY ? namespace : '-';
  const searchParams = `${new URLSearchParams({
    summary: `${options?.summary}`,
    ...(options?.groupBy ? { group_by: `${options.groupBy}` } : {}),
    // default sort should always be by `create_time desc`
    // order_by: 'create_time desc', not supported yet
    page_size: `${Math.max(
      MINIMUM_PAGE_SIZE,
      Math.min(
        MAXIMUM_PAGE_SIZE,
        options?.limit >= 0 ? options.limit : options?.pageSize ?? 30,
      ),
    )}`,
    ...(nextPageToken ? { page_token: nextPageToken } : {}),
    filter: AND(
      EQ('data_type', options.data_type?.toString()),
      options.filter,
      selectorToFilter(options?.selector),
    ),
  }).toString()}`;
  return { searchNamespace, searchParams };
};

/**
 * Fetches the Tekton Results Summary data from the backend API
 * @param summaryRequest The request object containing the search namespace and search parameters
 * @param signal Optional AbortSignal to cancel the request
 * @param timeout Optional timeout in milliseconds (defaults to 90000ms)
 * @returns The parsed summary response object
 */
const fetchResultsSummary = async (
  summaryRequest: SummaryRequest,
  signal?: AbortSignal,
  timeout = 60000,
): Promise<SummaryResponse> => {
  const resultListResponse: DevConsoleEndpointResponse =
    await consoleFetchJSON.post(
      SUMMARY_FETCH_URL,
      summaryRequest,
      { signal },
      timeout,
    );

  if (!resultListResponse.statusCode) {
    throw new Error('Unexpected proxy response: Status code is missing!');
  }
  if (
    resultListResponse.statusCode < 200 ||
    resultListResponse.statusCode >= 300
  ) {
    throw new HttpError(
      `Unexpected status code: ${resultListResponse.statusCode}`,
      resultListResponse.statusCode,
      null,
      resultListResponse,
    );
  }
  try {
    return JSON.parse(resultListResponse.body) as SummaryResponse;
  } catch (e) {
    throw new Error('Failed to parse task details response body as JSON');
  }
};

export const getResultsSummary = async (
  namespace: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
  isDevConsoleProxyAvailable?: boolean,
  signal?: AbortSignal,
  timeout = 60000,
) => {
  try {
    if (isDevConsoleProxyAvailable) {
      const { searchNamespace, searchParams } = await fetchSummaryURLConfig(
        namespace,
        options,
        nextPageToken,
      );

      const sData: SummaryResponse = await fetchResultsSummary(
        {
          searchNamespace,
          searchParams,
        },
        signal,
        timeout,
      );

      return sData;
    } else {
      const url = await createTektonResultsSummaryUrl(
        namespace,
        options,
        nextPageToken,
      );

      const sData: SummaryResponse = await consoleProxyFetchJSON({
        url,
        method: 'GET',
        allowInsecure: true,
        allowAuthHeader: true,
        signal,
        timeout,
      });

      return sData;
    }
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    return generateMockSummary(options);
  }
};
