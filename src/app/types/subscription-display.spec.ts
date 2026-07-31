import {
  SubscriptionStatus,
  getSubscriptionExpirationLabel,
  getSubscriptionTypeLabel,
} from './SubscriptionTypes';

function makeStatus(overrides: Partial<SubscriptionStatus> = {}): SubscriptionStatus {
  return {
    active: true,
    isFounder: false,
    isStudent: false,
    subscription: {
      id: 'sub_1',
      status: 'active',
      created: null,
      currentPeriodEnd: '2026-08-15T12:00:00Z',
      currentPeriodStart: '2026-08-08T12:00:00Z',
      cancelAtPeriodEnd: false,
      willAutoRenew: true,
      originalStartDate: null,
      plan: { id: 'p1', nickname: 'Professional Plan', amount: 2000, interval: 'week' },
    },
    usage: {
      pdfsGenerated: 0,
      lastPdfGeneration: null,
      pdfUsageLimit: 100,
      subscriptionStatus: 'active',
      subscriptionFeatures: { pdfGeneration: true, unlimitedPdfs: true, pdfLimit: null },
      resetDate: null,
      remainingPdfs: 100,
    },
    plan: 'Professional Plan',
    ...overrides,
  };
}

describe('checkout subscription display helpers', () => {
  it('should label Founders Rate with interval and no dollar amount', () => {
    const label = getSubscriptionTypeLabel(
      makeStatus({
        isFounder: true,
        subscription: {
          ...makeStatus().subscription!,
          plan: { id: 'p', nickname: 'Founders Rate', amount: 1000, interval: 'week' },
        },
      })
    );
    expect(label).toBe('Founders Rate · Weekly');
    expect(label).not.toContain('$');
  });

  it('should label Student Rate when isStudent is true', () => {
    expect(getSubscriptionTypeLabel(makeStatus({ isStudent: true }))).toContain('Student Rate');
  });

  it('should show Renews for active auto-renewing subscriptions', () => {
    const label = getSubscriptionExpirationLabel(makeStatus());
    expect(label).toMatch(/^Renews /);
    expect(label).toContain('2026');
  });

  it('should show Expires when cancelAtPeriodEnd is true', () => {
    const status = makeStatus();
    status.subscription!.cancelAtPeriodEnd = true;
    expect(getSubscriptionExpirationLabel(status)).toMatch(/^Expires /);
  });

  it('should not expose price for inactive subscriptions', () => {
    const label = getSubscriptionTypeLabel(makeStatus({ active: false }));
    expect(label).toBe('No active subscription');
    expect(label).not.toContain('$');
  });
});
