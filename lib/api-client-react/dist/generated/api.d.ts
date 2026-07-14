import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { AQIReading, Advisory, Attribution, ChatInput, ChatResponse, CitySummary, CompareWardsParams, EnforcementAction, ForecastPoint, GetCitySummaryParams, HealthStatus, ListEnforcementParams, ListWardsParams, Ward, WardComparison, WardSummary } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListWardsUrl: (params?: ListWardsParams) => string;
/**
 * @summary List all wards with latest AQI
 */
export declare const listWards: (params?: ListWardsParams, options?: RequestInit) => Promise<WardSummary[]>;
export declare const getListWardsQueryKey: (params?: ListWardsParams) => readonly ["/api/wards", ...ListWardsParams[]];
export declare const getListWardsQueryOptions: <TData = Awaited<ReturnType<typeof listWards>>, TError = ErrorType<unknown>>(params?: ListWardsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listWards>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listWards>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListWardsQueryResult = NonNullable<Awaited<ReturnType<typeof listWards>>>;
export type ListWardsQueryError = ErrorType<unknown>;
/**
 * @summary List all wards with latest AQI
 */
export declare function useListWards<TData = Awaited<ReturnType<typeof listWards>>, TError = ErrorType<unknown>>(params?: ListWardsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listWards>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetCitySummaryUrl: (params?: GetCitySummaryParams) => string;
/**
 * @summary City-wide AQI summary stats
 */
export declare const getCitySummary: (params?: GetCitySummaryParams, options?: RequestInit) => Promise<CitySummary>;
export declare const getGetCitySummaryQueryKey: (params?: GetCitySummaryParams) => readonly ["/api/wards/city-summary", ...GetCitySummaryParams[]];
export declare const getGetCitySummaryQueryOptions: <TData = Awaited<ReturnType<typeof getCitySummary>>, TError = ErrorType<unknown>>(params?: GetCitySummaryParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCitySummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCitySummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCitySummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getCitySummary>>>;
export type GetCitySummaryQueryError = ErrorType<unknown>;
/**
 * @summary City-wide AQI summary stats
 */
export declare function useGetCitySummary<TData = Awaited<ReturnType<typeof getCitySummary>>, TError = ErrorType<unknown>>(params?: GetCitySummaryParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCitySummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetWardUrl: (wardId: number) => string;
/**
 * @summary Get a single ward
 */
export declare const getWard: (wardId: number, options?: RequestInit) => Promise<Ward>;
export declare const getGetWardQueryKey: (wardId: number) => readonly [`/api/wards/${number}`];
export declare const getGetWardQueryOptions: <TData = Awaited<ReturnType<typeof getWard>>, TError = ErrorType<void>>(wardId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getWard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetWardQueryResult = NonNullable<Awaited<ReturnType<typeof getWard>>>;
export type GetWardQueryError = ErrorType<void>;
/**
 * @summary Get a single ward
 */
export declare function useGetWard<TData = Awaited<ReturnType<typeof getWard>>, TError = ErrorType<void>>(wardId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetWardReadingsUrl: (wardId: number) => string;
/**
 * @summary Historical AQI readings for a ward (last 24h)
 */
export declare const getWardReadings: (wardId: number, options?: RequestInit) => Promise<AQIReading[]>;
export declare const getGetWardReadingsQueryKey: (wardId: number) => readonly [`/api/wards/${number}/readings`];
export declare const getGetWardReadingsQueryOptions: <TData = Awaited<ReturnType<typeof getWardReadings>>, TError = ErrorType<unknown>>(wardId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWardReadings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getWardReadings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetWardReadingsQueryResult = NonNullable<Awaited<ReturnType<typeof getWardReadings>>>;
export type GetWardReadingsQueryError = ErrorType<unknown>;
/**
 * @summary Historical AQI readings for a ward (last 24h)
 */
export declare function useGetWardReadings<TData = Awaited<ReturnType<typeof getWardReadings>>, TError = ErrorType<unknown>>(wardId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWardReadings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetWardAttributionUrl: (wardId: number) => string;
/**
 * @summary AI-generated pollution source attribution for a ward
 */
export declare const getWardAttribution: (wardId: number, options?: RequestInit) => Promise<Attribution>;
export declare const getGetWardAttributionQueryKey: (wardId: number) => readonly [`/api/wards/${number}/attribution`];
export declare const getGetWardAttributionQueryOptions: <TData = Awaited<ReturnType<typeof getWardAttribution>>, TError = ErrorType<unknown>>(wardId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWardAttribution>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getWardAttribution>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetWardAttributionQueryResult = NonNullable<Awaited<ReturnType<typeof getWardAttribution>>>;
export type GetWardAttributionQueryError = ErrorType<unknown>;
/**
 * @summary AI-generated pollution source attribution for a ward
 */
export declare function useGetWardAttribution<TData = Awaited<ReturnType<typeof getWardAttribution>>, TError = ErrorType<unknown>>(wardId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWardAttribution>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetWardForecastUrl: (wardId: number) => string;
/**
 * @summary 72-hour AQI forecast for a ward
 */
export declare const getWardForecast: (wardId: number, options?: RequestInit) => Promise<ForecastPoint[]>;
export declare const getGetWardForecastQueryKey: (wardId: number) => readonly [`/api/wards/${number}/forecast`];
export declare const getGetWardForecastQueryOptions: <TData = Awaited<ReturnType<typeof getWardForecast>>, TError = ErrorType<unknown>>(wardId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWardForecast>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getWardForecast>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetWardForecastQueryResult = NonNullable<Awaited<ReturnType<typeof getWardForecast>>>;
export type GetWardForecastQueryError = ErrorType<unknown>;
/**
 * @summary 72-hour AQI forecast for a ward
 */
export declare function useGetWardForecast<TData = Awaited<ReturnType<typeof getWardForecast>>, TError = ErrorType<unknown>>(wardId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWardForecast>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetWardAdvisoryEnUrl: (wardId: number) => string;
/**
 * @summary English health advisory for a ward
 */
export declare const getWardAdvisoryEn: (wardId: number, options?: RequestInit) => Promise<Advisory>;
export declare const getGetWardAdvisoryEnQueryKey: (wardId: number) => readonly [`/api/wards/${number}/advisory/en`];
export declare const getGetWardAdvisoryEnQueryOptions: <TData = Awaited<ReturnType<typeof getWardAdvisoryEn>>, TError = ErrorType<unknown>>(wardId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWardAdvisoryEn>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getWardAdvisoryEn>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetWardAdvisoryEnQueryResult = NonNullable<Awaited<ReturnType<typeof getWardAdvisoryEn>>>;
export type GetWardAdvisoryEnQueryError = ErrorType<unknown>;
/**
 * @summary English health advisory for a ward
 */
export declare function useGetWardAdvisoryEn<TData = Awaited<ReturnType<typeof getWardAdvisoryEn>>, TError = ErrorType<unknown>>(wardId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWardAdvisoryEn>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetWardAdvisoryTaUrl: (wardId: number) => string;
/**
 * @summary Tamil health advisory for a ward
 */
export declare const getWardAdvisoryTa: (wardId: number, options?: RequestInit) => Promise<Advisory>;
export declare const getGetWardAdvisoryTaQueryKey: (wardId: number) => readonly [`/api/wards/${number}/advisory/ta`];
export declare const getGetWardAdvisoryTaQueryOptions: <TData = Awaited<ReturnType<typeof getWardAdvisoryTa>>, TError = ErrorType<unknown>>(wardId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWardAdvisoryTa>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getWardAdvisoryTa>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetWardAdvisoryTaQueryResult = NonNullable<Awaited<ReturnType<typeof getWardAdvisoryTa>>>;
export type GetWardAdvisoryTaQueryError = ErrorType<unknown>;
/**
 * @summary Tamil health advisory for a ward
 */
export declare function useGetWardAdvisoryTa<TData = Awaited<ReturnType<typeof getWardAdvisoryTa>>, TError = ErrorType<unknown>>(wardId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWardAdvisoryTa>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListEnforcementUrl: (params?: ListEnforcementParams) => string;
/**
 * @summary Prioritized enforcement recommendations
 */
export declare const listEnforcement: (params?: ListEnforcementParams, options?: RequestInit) => Promise<EnforcementAction[]>;
export declare const getListEnforcementQueryKey: (params?: ListEnforcementParams) => readonly ["/api/enforcement", ...ListEnforcementParams[]];
export declare const getListEnforcementQueryOptions: <TData = Awaited<ReturnType<typeof listEnforcement>>, TError = ErrorType<unknown>>(params?: ListEnforcementParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEnforcement>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listEnforcement>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListEnforcementQueryResult = NonNullable<Awaited<ReturnType<typeof listEnforcement>>>;
export type ListEnforcementQueryError = ErrorType<unknown>;
/**
 * @summary Prioritized enforcement recommendations
 */
export declare function useListEnforcement<TData = Awaited<ReturnType<typeof listEnforcement>>, TError = ErrorType<unknown>>(params?: ListEnforcementParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEnforcement>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCompareWardsUrl: (params: CompareWardsParams) => string;
/**
 * @summary Compare AQI trends across multiple wards
 */
export declare const compareWards: (params: CompareWardsParams, options?: RequestInit) => Promise<WardComparison[]>;
export declare const getCompareWardsQueryKey: (params?: CompareWardsParams) => readonly ["/api/compare", ...CompareWardsParams[]];
export declare const getCompareWardsQueryOptions: <TData = Awaited<ReturnType<typeof compareWards>>, TError = ErrorType<unknown>>(params: CompareWardsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof compareWards>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof compareWards>>, TError, TData> & {
    queryKey: QueryKey;
};
export type CompareWardsQueryResult = NonNullable<Awaited<ReturnType<typeof compareWards>>>;
export type CompareWardsQueryError = ErrorType<unknown>;
/**
 * @summary Compare AQI trends across multiple wards
 */
export declare function useCompareWards<TData = Awaited<ReturnType<typeof compareWards>>, TError = ErrorType<unknown>>(params: CompareWardsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof compareWards>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSendChatMessageUrl: () => string;
/**
 * @summary Ask AeroSense a natural-language question
 */
export declare const sendChatMessage: (chatInput: ChatInput, options?: RequestInit) => Promise<ChatResponse>;
export declare const getSendChatMessageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendChatMessage>>, TError, {
        data: BodyType<ChatInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendChatMessage>>, TError, {
    data: BodyType<ChatInput>;
}, TContext>;
export type SendChatMessageMutationResult = NonNullable<Awaited<ReturnType<typeof sendChatMessage>>>;
export type SendChatMessageMutationBody = BodyType<ChatInput>;
export type SendChatMessageMutationError = ErrorType<unknown>;
/**
* @summary Ask AeroSense a natural-language question
*/
export declare const useSendChatMessage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendChatMessage>>, TError, {
        data: BodyType<ChatInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendChatMessage>>, TError, {
    data: BodyType<ChatInput>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map