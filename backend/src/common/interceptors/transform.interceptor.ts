import {
  CallHandler, // 컨트롤러가 리턴한 값을 다음 단계로 넘기는 핸들러를 표현. Interceptor은 여기서 반환 스트림을 가로채 변형함
  ExecutionContext, // 현재 실행 중인 컨텍스트(HTTP, RPC, WS)를 추상화해, HTTP 객체에 접근할 수 있게함
  Injectable, // 이 클래스가 DI 컨테이너로 관리되는 프로바이더임을 선언
  NestInterceptor, // Interceptor의 인터페이스
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';

interface SuccessBody {
  success: true;
  data: unknown;
  meta: {
    timestamp: string;
    path: string;
    appName: string;
    env: string;
    traceId: string;
    latencyMs: number;
  };
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly config: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler<any>) {
    const req = context.switchToHttp().getRequest();
    const path = (req as any)?.url ?? '';
    const appName = this.config.get<string>('APP_NAME') ?? 'app';
    const env = this.config.get<string>('NODE_ENV') ?? 'development';

    const startNs: bigint = req?.__startAtNs ?? process.hrtime.bigint();
    const traceId: string = req?.__traceId ?? '';

    return next.handle().pipe(
      map((data) => {
        // 이미 포맷이 있으면 그대로 통과 (이중 포장 방지)
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        const endNs = process.hrtime.bigint();
        const latencyMs = Number(endNs - startNs) / 1_000_000;

        const body: SuccessBody = {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            path,
            appName,
            env,
            traceId,
            latencyMs: Number(latencyMs.toFixed(2)),
          },
        };
        return body;
      }),
    );
  }
}
