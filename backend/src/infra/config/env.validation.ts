import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

export class EnvVars {
  @IsString()
  APP_NAME!: string;

  @IsIn(['development', 'test', 'production'])
  NODE_ENV!: 'development' | 'test' | 'production';

  @IsInt()
  @Min(1)
  @IsOptional()
  PORT?: number;
}

export function validateEnv(config: Record<string, unknown>) {
  // 문자열로 넘어온 PORT를 number로 변환
  if (typeof config.PORT === 'string') {
    const n = Number(config.PORT);
    if (!Number.isNaN(n)) config.PORT = n;
  }

  const transformed = plainToInstance(EnvVars, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(transformed, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    // 간단 메시지로 압축
    const msg = errors
      .map((e) => Object.values(e.constraints ?? {}))
      .flat()
      .join(', ');
    throw new Error(`Invalid environment: ${msg}`);
  }
  return transformed;
}
