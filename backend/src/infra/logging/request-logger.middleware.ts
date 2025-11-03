import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

/**
 * 요청마다 traceId를 생성하고 시작시각을 기록
 * - 응답이 끝나면 method/path/status/latencyMs/traceId를 한 줄로 로깅
 * TODO: 추후 pino로 대체 및 확장
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: any, res: any, next: () => void) {
    // traceId 발급 및 시작 시각 기록
    const traceId = randomUUID();
    req.__traceId = traceId;

    // 고해상도 시간 (나노초) → ms로 계산 예정
    req.__startAtNs = process.hrtime.bigint();

    // 응답 헤더에 traceId 노출 (클라이언트/로그 상호 참조)
    res.setHeader('x-trace-id', traceId);

    // 응답 종료 시점에 한번만 로그 출력
    res.on('finish', () => {
      const endNs = process.hrtime.bigint();
      const startNs: bigint = req.__startAtNs ?? endNs;
      const latencyMs = Number(endNs - startNs) / 1_000_000;

      const log = {
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        latencyMs: Number(latencyMs.toFixed(2)),
        traceId,
      };

      // 단일 라인 로그 (후속 단계에서 pino-http로 대체 예정)
      this.logger.log(JSON.stringify(log));
    });

    next();
  }
}
