import { Injectable } from '@nestjs/common'
import { getGreeting } from './greeting'

@Injectable()
export class GreetingService {
  getGreeting(name?: string): string {
    return getGreeting(name)
  }
}
