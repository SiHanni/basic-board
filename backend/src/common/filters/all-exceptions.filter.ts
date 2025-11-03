import {
  ExceptionFilter, // 예외를 가로채서 응답 포맷을 통일, 컨트롤러, 서비스에서 던진 모든 예외를 여기서 JSON 형태로 표준화하기 위함
  Catch, // 어떤 예외를 이 필터가 잡을지 선언하는데 사용됨. @Catch()는 모든 예외를 잡는다(글로벌 핸들러 성격)
  ArgumentsHost, // HTTP, RPC, WS 등 실행 컨텍스트에 접근하는 어댑터
  HttpException, // Nest가 제공하는 표준 HTTP 예외 베이스 클래스
  HttpStatus,
} from '@nestjs/common';

// 에러 응답 스펙은 프로젝트가 커질수록 필드 추가가 잦아질 수 있으므로, 상속/병합의 측면에서 interface를 사용
interface ErrorBody {
  success: false;
  error: {
    message: string | string[];
    code: number;
  };
  meta: {
    timestamp: string;
    path: string;
  };
}

/** **전역 에러 처리**: 모든 예외를 잡아 일관된 에러 응답 바디로 변환하고, HTTP 상태 코드를 맞춰 반환 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<any>();
    const req = ctx.getRequest<any>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttp
      ? (exception as HttpException).getResponse()
      : 'Internal server error';

    const normalizedMessage =
      typeof message === 'string'
        ? message
        : ((message as any)?.message ?? 'Internal server error');

    const body: ErrorBody = {
      success: false,
      error: {
        message: normalizedMessage,
        code: status,
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: req?.url ?? '',
      },
    };

    res.status(status).json(body);
  }
}
