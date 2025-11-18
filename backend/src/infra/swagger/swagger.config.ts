import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Swagger 문서 전역 설정 */
export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Basic Board API')
    .setDescription('NestJS 게시판 API 문서')
    .setVersion('0.1.0')
    .addCookieAuth('sid', {
      type: 'apiKey',
      in: 'cookie',
      name: 'sid',
    })
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api-docs', app, doc, {
    swaggerOptions: { persistAuthorization: true },
  });
}
