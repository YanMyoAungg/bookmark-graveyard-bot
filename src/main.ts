import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Explicitly enable shutdown hooks for bot cleanup
  app.enableShutdownHooks();

  // Explicitly listen on 0.0.0.0 for Render compatibility
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on port: ${port}`);
}
bootstrap().catch(console.error);
