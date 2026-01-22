import {
  FixedProductMarketMakerFactory,
  FPMM
} from 'generated';

// --- FixedProductMarketMakerFactory ---

FixedProductMarketMakerFactory.FixedProductMarketMakerCreation.handler(async ({ event, context }) => {
    const fpmm: FPMM = {
        id: event.params.fixedProductMarketMaker.toLowerCase(),
        conditionId: event.params.conditionIds[0] // Assuming first one
    };
    context.FPMM.set(fpmm);
});

FixedProductMarketMakerFactory.FixedProductMarketMakerCreation.contractRegister(async ({ event, context }) => {
    context.addFixedProductMarketMaker(event.params.fixedProductMarketMaker);
});
