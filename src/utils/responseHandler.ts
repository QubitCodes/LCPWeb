import { NextResponse } from 'next/server';

interface ResponseData {
  status: boolean;
  message: string;
  code: number;
  data?: any;
  misc?: any;
  errors?: any[];
}

export const RESPONSE_CODES = {
  // 1xx: Success
  OK: 100,
  CREATED: 101,
  ACCEPTED: 102,
  UPDATED: 103,
  
  // 2xx: Client Errors
  GENERAL_CLIENT_ERROR: 200,
  VALIDATION_ERROR: 201,
  MISSING_REQUIRED_FIELD: 202,
  INVALID_FORMAT: 203,
  INVALID_INPUT_DATA: 204,
  RESOURCE_ALREADY_EXISTS: 205,
  AUTHENTICATION_ERROR: 210,
  AUTHORIZATION_ERROR: 211,
  PERMISSION_DENIED: 212,
  RATE_LIMIT_EXCEEDED: 220,
  HEADER_ERROR: 230,
  UNSUPPORTED_MEDIA_TYPE: 240,

  // 3xx: Server Errors
  GENERAL_SERVER_ERROR: 300,
  DATABASE_ERROR: 301,
  EXTERNAL_SERVICE_ERROR: 302,
  TIMEOUT: 303,
  INTERNAL_SERVICE_ERROR: 304,
  RESOURCE_NOT_FOUND: 310,
  RESOURCE_GONE: 311,

  // 4xx: Business Logic Errors
  GENERAL_BUSINESS_LOGIC_ERROR: 400,
  INSUFFICIENT_FUNDS: 401,
  ORDER_CANNOT_BE_PROCESSED: 402,
  ACCOUNT_INACTIVE: 403,

  // 9xx: System Errors
  UNKNOWN_ERROR: 900,
  SYSTEM_MAINTENANCE: 901
};

export const sendResponse = (
  statusCode: number,
  data: ResponseData
) => {
  return NextResponse.json(data, { status: statusCode });
};