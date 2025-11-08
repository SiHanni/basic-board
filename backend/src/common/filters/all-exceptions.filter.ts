import {
  ExceptionFilter, // 예외를 가로채서 응답 포맷을 통일, 컨트롤러, 서비스에서 던진 모든 예외를 여기서 JSON 형태로 표준화하기 위함
  Catch, // 어떤 예외를 이 필터가 잡을지 선언하는데 사용됨. @Catch()는 모든 예외를 잡는다(글로벌 핸들러 성격)
  ArgumentsHost, // HTTP, RPC, WS 등 실행 컨텍스트에 접근하는 어댑터
  HttpException, // Nest가 제공하는 표준 HTTP 예외 베이스 클래스
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';

// 에러 응답 스펙은 프로젝트가 커질수록 필드 추가가 잦아질 수 있으므로, 상속/병합의 측면에서 interface를 사용
type ErrorPayload = {
  code?: string;
  message?: string | string[];
  details?: unknown;
  error?: string; // Nest 기본 Bad Request 구조
  statusCode?: number; // Nest 기본 Bad Request 구조
};

interface ErrorBody {
  success: false;
  error: { code: string; message: string; details: unknown | null };
  meta: { timestamp: string; path: string; traceId: string };
}

/** **전역 에러 처리**: 모든 예외를 잡아 일관된 에러 응답 바디로 변환하고, HTTP 상태 코드를 맞춰 반환 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<any>();
    const req = ctx.getRequest<any>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();

      // Nest 기본: string 또는 object
      if (typeof payload === 'string') {
        code = this.statusToCode(status); // ex) CONFLICT
        message = payload;
      } else if (payload && typeof payload === 'object') {
        const p = payload as ErrorPayload;

        // class-validator 패턴 감지
        const isValidation =
          exception instanceof BadRequestException &&
          (Array.isArray(p.message) || p.error === 'Bad Request');

        if (isValidation) {
          code = 'VALIDATION_FAILED';
          message = 'Validation failed';
          details = p.message ?? null; // 에러 배열 그대로
        } else {
          code = p.code ?? this.statusToCode(status);
          // message가 배열이면 첫 요소, 문자열이면 그대로
          if (Array.isArray(p.message)) {
            message = String(p.message[0] ?? this.defaultMessage(status));
          } else if (typeof p.message === 'string') {
            message = p.message;
          } else {
            message = this.defaultMessage(status);
          }
          details = p.details ?? null;
        }
      } else {
        code = this.statusToCode(status);
        message = this.defaultMessage(status);
      }
    } else {
      // TODO: 필요 시 DB 에러(QueryFailedError) 매핑 추가
      // 예: 중복키 에러를 USER_EMAIL_CONFLICT로 변환 등
    }

    const body: ErrorBody = {
      success: false,
      error: { code, message, details },
      meta: {
        timestamp: new Date().toISOString(),
        path: req?.url ?? '',
        traceId: req?.__traceId ?? '',
      },
    };

    res.status(status).json(body);
  }
  /** 409 -> "CONFLICT" 같은 enum 역매핑을 우선 사용 */
  private statusToCode(status: number): string {
    return (HttpStatus[status] as string) ?? 'HTTP_ERROR';
  }

  private defaultMessage(status: number): string {
    // 상황별 커스텀 메시지 맵 (없으면 상태명 그대로 사용)
    const defaults: Partial<Record<string, string>> = {
      BAD_REQUEST: 'Bad request',
      UNAUTHORIZED: 'Unauthorized',
      FORBIDDEN: 'Forbidden',
      NOT_FOUND: 'Not found',
      CONFLICT: 'Conflict',
    };
    const key = this.statusToCode(status);
    return defaults[key] ?? 'Request failed';
  }
}
