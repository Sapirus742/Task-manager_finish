import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateExchangeDto } from 'src/common/types';
import { Exchange } from 'src/orm/exchange.entity';
import { Project } from 'src/orm/project.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class ExchangeService {
  constructor(
    @InjectRepository(Exchange)
    private readonly exchangeRepository: Repository<Exchange>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  async findAll(): Promise<Exchange[]> {
    return this.exchangeRepository.find({ relations: ['projects'] });
  }

  async findOne(id: number): Promise<Exchange | any> {
    const exchange = await this.exchangeRepository.findOne({
      where: { id },
      relations: ['projects'],
    });
    return exchange;
  }

  async create(
    name: string,
    startExchange: Date,
    stopExchange: Date,
  ): Promise<Exchange> {
    const exchange = new Exchange();
    exchange.name = name;
    exchange.startExchange = startExchange;
    exchange.stopExchange = stopExchange;
    return this.exchangeRepository.save(exchange);
  }

  async update(id: number, updateExchangeDto: UpdateExchangeDto): Promise<Exchange> {
    const exchange = await this.exchangeRepository.findOne({ where: { id } });

    if (!exchange) {
        throw new NotFoundException(`Exchange with id ${id} not found`);
    }

    // Обновите поля проекта
    Object.assign(exchange, updateExchangeDto);

    if (updateExchangeDto.projects) {
        const projects = await this.projectsRepository.find({ where: { id: In(updateExchangeDto.projects) } });
        if (projects.length === 0) {
            throw new NotFoundException(`Нет проектов с id ${updateExchangeDto.projects.join(', ')}`);
        }
        exchange.projects = projects; // Установите связь с комментариями
    }

    return this.exchangeRepository.save(exchange);
  }

  async remove(id: number): Promise<void> {
    const exchange = await this.exchangeRepository.findOne({ where: { id } });

    if (!exchange) {
        throw new NotFoundException(`Exchange with id ${id} not found`);
    }

    await this.exchangeRepository.remove(exchange);
  }
}