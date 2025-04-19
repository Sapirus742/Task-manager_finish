import {
    Body,
    Controller,
    Delete,
    Get,
    Logger,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateMessageDto, UpdateMessageDto } from 'src/common/types';
import { MessageService } from './message.service';
import { Message } from 'src/orm/message.entity';

@Controller('message')

export class MessageController {
  private readonly logger = new Logger(MessageController.name);

  constructor(private messageService: MessageService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<Message[]> {
    return this.messageService.findAll();
  }
 
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number): Promise<Message> {
    return this.messageService.findOne(id);
  }
  
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() message: CreateMessageDto): Promise<Message> {
    return this.messageService.create(
    message.message,
    message.users,
    message.agile,
    );
  }
  
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: number, @Body() updateMessageDto: UpdateMessageDto): Promise<Message> {
    return this.messageService.update(id, updateMessageDto);
  }
 
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number): Promise<void> {
    return this.messageService.remove(id);
  }
}