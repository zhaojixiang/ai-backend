import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ResponseMessage } from '../common/response-message.decorator';
import { ProcessVideoDto } from './dto/process-video.dto';
import { VideoService } from './video.service';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('process')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ResponseMessage('任务已排队')
  async process(@Body() body: ProcessVideoDto) {
    return this.videoService.process(body.url);
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    return this.videoService.getStatus(id);
  }

  @Get(':id/scenes')
  async getScenes(@Param('id') id: string) {
    return this.videoService.getScenes(id);
  }
}
