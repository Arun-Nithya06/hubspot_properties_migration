import { Module } from '@nestjs/common';
import { HubspotAPIService } from './hubspot-api.service';
import { HubspotController } from './hubspot.controller';
import { HubspotService } from './hubspot.service';

@Module({
  providers: [HubspotAPIService, HubspotService],
  controllers: [HubspotController],
})
export class HubspotModule {}
