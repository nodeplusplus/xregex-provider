import path from "path";
import faker from "faker";
import { Container } from "inversify";
import { createSilent as createLogger } from "@nodeplusplus/xregex-logger";

import {
  Builder,
  Director,
  IXProvider,
  IQuotaManager,
  IRotation,
  IStorage,
  helpers,
} from "../../src";

const redis = require("../../mocks/helpers").redis;
const resources = require(path.resolve(__dirname, "../../mocks/resources"));
const settings = require(path.resolve(__dirname, "../../mocks/settings"));

describe("XProvider", () => {
  let container: Container;
  let provider: IXProvider;
  let quotaManager: IQuotaManager;
  let rotation: IRotation;
  let storageIds: string[] = [];
  const scopeKey = helpers.redis.generateKey([]);

  beforeAll(async () => {
    await redis.clear();

    const builder = new Builder();
    new Director().constructSimpleProvider(builder);
    builder.setLogger(createLogger());
    builder.setSettings(settings);

    container = builder.getContainer();
    provider = builder.getProvider();
  });

  it("should start successfully", async () => {
    await provider.start();
    // components will start with provider
    quotaManager = container.get("XPROVIDER.QUOTA_MANAGER");
    rotation = container.get("XPROVIDER.ROTATION");
  });

  it("should acquire item succesfully", async () => {
    const tag = "proxy";
    const [value, storageId] = await provider.acquire({ tags: [tag] });

    expect(value).toBeTruthy();
    expect(storageId).toBeTruthy();
    expect(storageId?.includes(tag)).toBeTruthy();

    storageIds.push(storageId as string);

    const usedQuota = await quotaManager.get(storageIds[0]);
    expect(usedQuota).toBe(1);

    const isInRotation = await rotation.includes(storageIds, scopeKey);
    expect(isInRotation).toBeTruthy();
  });

  it("should release item succesfully", async () => {
    const remainQuota = await provider.release(storageIds[0]);
    expect(remainQuota).toBe(settings.quotaManager.quotas.proxy.point);

    const usedQuota = await quotaManager.get(storageIds[0]);
    expect(usedQuota).toBe(0);
  });

  it("should release non-exist id as well", async () => {
    const id = faker.random.uuid();
    const domain = faker.internet.domainName();
    const remainQuota = await provider.release(id, { scopes: [domain] });

    expect(remainQuota).toBe(settings.quotaManager.quotas.proxy.point);
  });

  it("should acquire each item before restart the flow", async () => {
    const tag = "proxy";

    const items: Array<{
      value: any;
    }> = resources.filter((r: { tags: string[] }) => r.tags.includes(tag));

    for (let i = 0; i < items.length; i++) {
      const [, storageId] = await provider.acquire({ tags: [tag] });
      expect(storageId).toBeTruthy();

      // Make sure rotation is always filled with storageId
      if (!storageIds.includes(storageId as string)) {
        const isInRotation = await rotation.includes(
          [storageId as string],
          scopeKey
        );
        expect(isInRotation).toBeTruthy();

        storageIds.push(storageId as string);
      }

      // We acquired an item before,
      // so we had cleaned all item before push last item to our rotation
      if (i === items.length - 1) {
        const isCurrentItemInRotation = await rotation.includes(
          [storageId as string],
          scopeKey
        );
        expect(isCurrentItemInRotation).toBeTruthy();

        const isOtherItemsInRotation = await rotation.includes(
          storageIds.filter((id) => id !== storageId),
          scopeKey
        );
        expect(isOtherItemsInRotation).toBeFalsy();
      }
    }
  });

  it("should deactivate entity successfully", async () => {
    const deactivatedId = storageIds[0] as string;

    await provider.deactivate(deactivatedId);

    const storage = container.get<IStorage>("XPROVIDER.STORAGE");
    const entity = await storage.get(deactivatedId);
    expect(entity).toBeFalsy();
  });

  it("should ignore invalid id when deactivate resource", async () => {
    const deactivatedId = faker.random.uuid();
    await provider.deactivate(deactivatedId);
  });

  it("should stop successfully", async () => {
    await provider.clear();
    await provider.stop();
  });
});
