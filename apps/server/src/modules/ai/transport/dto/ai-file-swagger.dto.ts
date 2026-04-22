import { ApiProperty } from '@nestjs/swagger'

export class FileExtractionResultDto {
  @ApiProperty({
    description: '原始文件名',
    example: 'resume.pdf',
  })
  fileName!: string

  @ApiProperty({
    description: '文件类型',
    enum: ['txt', 'md', 'pdf', 'docx'],
    example: 'pdf',
  })
  fileType!: 'txt' | 'md' | 'pdf' | 'docx'

  @ApiProperty({
    description: '文件 MIME 类型',
    example: 'application/pdf',
  })
  mimeType!: string

  @ApiProperty({
    description: '提取后的纯文本',
  })
  text!: string

  @ApiProperty({
    description: '文本字符数',
    example: 1024,
  })
  charCount!: number
}
