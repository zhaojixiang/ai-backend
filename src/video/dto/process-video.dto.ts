import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class ProcessVideoDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'url 必须是有效的 http(s) 地址' },
  )
  url!: string;
}
