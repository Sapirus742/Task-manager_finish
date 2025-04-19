import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/orm/user.entity';
import { UpdateMessageDto } from 'src/common/types';
import { Message } from 'src/orm/message.entity';
import { Agile } from 'src/orm/agile.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Agile)
    private readonly agileRepository: Repository<Agile>,
  ) {}

  async findAll(): Promise<Message[]> {
    return this.messageRepository.find({ relations: ['users', 'agile'] });
  }
  
  async findOne(id: number): Promise<Message | any> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['users', 'agile'],
    });
    return message;
  }
  
  async create(
    message: string,
    users: number,
    agile: number,
  ): Promise<Message> {
    const messages = new Message();
    messages.message = message;
    const usersEntity = await this.userRepository.findOne({ where: { id: users } });
    const agileEntity = await this.agileRepository.findOne({ where: { id: agile } });

    if (!usersEntity) {throw new NotFoundException(`User with id ${users} not found`)}
    if (!agileEntity) {throw new NotFoundException(`Agile with id ${agile} not found`)}
    messages.users = usersEntity;
    messages.agile = agileEntity;
    return this.messageRepository.save(messages);
  }

  async update(id: number, updateMessageDto: UpdateMessageDto): Promise<Message> {
    const messages = await this.messageRepository.findOne({ where: { id }, relations: ['users', 'agile'] });

    if (!messages) {
        throw new NotFoundException(`Message with id ${id} not found`);
    }

    // Обновите другие поля
    Object.assign(messages, updateMessageDto);

    return this.messageRepository.save(messages);
  }

  async remove(id: number): Promise<void> {
    const message = await this.messageRepository.findOne({ where: { id } });

    if (!message) {
        throw new NotFoundException(`Message with id ${id} not found`);
    }

    await this.messageRepository.remove(message);
  }
}