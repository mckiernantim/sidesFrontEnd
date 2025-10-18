import {
  SubscriptionStatus,
  SubscriptionPlan,
  UsageInfo,
  UsageSummary,
  SubscriptionActions,
  getUsageSummary,
  getSubscriptionActions,
  formatSubscriptionStatus,
  formatPlanName,
  formatAmount,
  isSubscriptionActive,
  canUserGeneratePdf,
  getNextResetDate,
  getDaysUntilReset
} from './SubscriptionTypes';

describe('Subscription Types and Utilities', () => {
  const mockActiveSubscription: SubscriptionStatus = {
    active: true,
    subscription: {
      id: 'sub_test123',
      status: 'active',
      created: '2024-01-01T00:00:00Z',
      currentPeriodEnd: '2024-02-01T00:00:00Z',
      currentPeriodStart: '2024-01-01T00:00:00Z',
      cancelAtPeriodEnd: false,
      willAutoRenew: true,
      originalStartDate: '2024-01-01T00:00:00Z',
      plan: {
        id: 'plan_monthly',
        nickname: 'Monthly Plan',
        amount: 2999,
        interval: 'month'
      }
    },
    usage: {
      pdfsGenerated: 5,
      lastPdfGeneration: '2024-01-15T00:00:00Z',
      pdfUsageLimit: 50,
      subscriptionStatus: 'active',
      subscriptionFeatures: {
        pdfGeneration: true,
        unlimitedPdfs: false,
        pdfLimit: 50
      },
      resetDate: '2024-02-01T00:00:00Z',
      remainingPdfs: 45
    },
    plan: 'monthly',
    lastPayment: {
      status: 'succeeded',
      amount: 2999,
      date: '2024-01-01T00:00:00Z'
    }
  };

  const mockInactiveSubscription: SubscriptionStatus = {
    active: false,
    subscription: {
      id: 'sub_canceled',
      status: 'canceled',
      created: '2024-01-01T00:00:00Z',
      currentPeriodEnd: '2024-01-31T00:00:00Z',
      currentPeriodStart: '2024-01-01T00:00:00Z',
      cancelAtPeriodEnd: true,
      willAutoRenew: false,
      originalStartDate: '2024-01-01T00:00:00Z',
      plan: {
        id: 'plan_monthly',
        nickname: 'Monthly Plan',
        amount: 2999,
        interval: 'month'
      }
    },
    usage: {
      pdfsGenerated: 0,
      lastPdfGeneration: null,
      pdfUsageLimit: 0,
      subscriptionStatus: 'canceled',
      subscriptionFeatures: {
        pdfGeneration: false,
        unlimitedPdfs: false,
        pdfLimit: 0
      },
      resetDate: null,
      remainingPdfs: 0
    },
    plan: null
  };

  const mockUnlimitedSubscription: SubscriptionStatus = {
    active: true,
    subscription: {
      id: 'sub_unlimited',
      status: 'active',
      created: '2024-01-01T00:00:00Z',
      currentPeriodEnd: '2024-02-01T00:00:00Z',
      currentPeriodStart: '2024-01-01T00:00:00Z',
      cancelAtPeriodEnd: false,
      willAutoRenew: true,
      originalStartDate: '2024-01-01T00:00:00Z',
      plan: {
        id: 'plan_unlimited',
        nickname: 'Unlimited Plan',
        amount: 9999,
        interval: 'month'
      }
    },
    usage: {
      pdfsGenerated: 1000,
      lastPdfGeneration: '2024-01-15T00:00:00Z',
      pdfUsageLimit: -1,
      subscriptionStatus: 'active',
      subscriptionFeatures: {
        pdfGeneration: true,
        unlimitedPdfs: true,
        pdfLimit: null
      },
      resetDate: '2024-02-01T00:00:00Z',
      remainingPdfs: -1
    },
    plan: 'unlimited'
  };

  describe('getUsageSummary', () => {
    it('should calculate usage summary for active subscription', () => {
      const summary = getUsageSummary(mockActiveSubscription);

      expect(summary.used).toBe(5);
      expect(summary.limit).toBe(50);
      expect(summary.remaining).toBe(45);
      expect(summary.canGenerate).toBeTrue();
      expect(summary.percentage).toBe(10);
      expect(summary.resetDate).toBe('2024-02-01T00:00:00Z');
    });

    it('should calculate usage summary for inactive subscription', () => {
      const summary = getUsageSummary(mockInactiveSubscription);

      expect(summary.used).toBe(0);
      expect(summary.limit).toBe(0);
      expect(summary.remaining).toBe(0);
      expect(summary.canGenerate).toBeFalse();
      expect(summary.percentage).toBe(0);
      expect(summary.resetDate).toBeNull();
    });

    it('should calculate usage summary for unlimited subscription', () => {
      const summary = getUsageSummary(mockUnlimitedSubscription);

      expect(summary.used).toBe(1000);
      expect(summary.limit).toBe(-1); // Unlimited shows as -1 limit
      expect(summary.remaining).toBe(0);
      expect(summary.canGenerate).toBeTrue(); // Can generate because unlimited
      expect(summary.percentage).toBe(0);
      expect(summary.resetDate).toBe('2024-02-01T00:00:00Z');
    });

    it('should handle edge case with zero limit', () => {
      const subscriptionWithZeroLimit = {
        ...mockActiveSubscription,
        usage: {
          ...mockActiveSubscription.usage,
          pdfUsageLimit: 0
        }
      };

      const summary = getUsageSummary(subscriptionWithZeroLimit);

      expect(summary.used).toBe(5);
      expect(summary.limit).toBe(0);
      expect(summary.remaining).toBe(0);
      expect(summary.canGenerate).toBeFalse();
      expect(summary.percentage).toBe(0);
    });
  });

  describe('getSubscriptionActions', () => {
    it('should return correct actions for active subscription', () => {
      const actions = getSubscriptionActions(mockActiveSubscription);

      expect(actions.canUpgrade).toBeFalse(); // Monthly plan, not weekly
      expect(actions.canCancel).toBeTrue();
      expect(actions.canReactivate).toBeFalse();
      expect(actions.showBillingPortal).toBeTrue();
    });

    it('should return correct actions for inactive subscription', () => {
      const actions = getSubscriptionActions(mockInactiveSubscription);

      expect(actions.canUpgrade).toBeFalse();
      expect(actions.canCancel).toBeFalse();
      expect(actions.canReactivate).toBeTrue();
      expect(actions.showBillingPortal).toBeTrue(); // Can show portal for canceled
    });

    it('should return correct actions for weekly subscription (can upgrade)', () => {
      const weeklySubscription = {
        ...mockActiveSubscription,
        subscription: {
          ...mockActiveSubscription.subscription,
          plan: {
            ...mockActiveSubscription.subscription!.plan!,
            interval: 'week'
          }
        }
      };

      const actions = getSubscriptionActions(weeklySubscription);

      expect(actions.canUpgrade).toBeTrue();
      expect(actions.canCancel).toBeTrue();
      expect(actions.canReactivate).toBeFalse();
      expect(actions.showBillingPortal).toBeTrue();
    });

    it('should return correct actions for subscription canceling at period end', () => {
      const cancelingSubscription = {
        ...mockActiveSubscription,
        subscription: {
          ...mockActiveSubscription.subscription,
          cancelAtPeriodEnd: true
        }
      };

      const actions = getSubscriptionActions(cancelingSubscription);

      expect(actions.canUpgrade).toBeFalse();
      expect(actions.canCancel).toBeFalse(); // Already canceling
      expect(actions.canReactivate).toBeTrue();
      expect(actions.showBillingPortal).toBeTrue();
    });
  });

  describe('formatSubscriptionStatus', () => {
    it('should format various status strings correctly', () => {
      expect(formatSubscriptionStatus('active')).toBe('Active');
      expect(formatSubscriptionStatus('trialing')).toBe('Trial');
      expect(formatSubscriptionStatus('pending')).toBe('Pending');
      expect(formatSubscriptionStatus('past_due')).toBe('Past Due');
      expect(formatSubscriptionStatus('canceled')).toBe('Canceled');
      expect(formatSubscriptionStatus('active_until_period_end')).toBe('Canceling');
      expect(formatSubscriptionStatus('inactive')).toBe('Inactive');
      expect(formatSubscriptionStatus('unknown_status')).toBe('Unknown_status');
    });

    it('should handle null status', () => {
      expect(formatSubscriptionStatus(null)).toBe('Inactive');
    });

    it('should handle undefined status', () => {
      expect(formatSubscriptionStatus(undefined as any)).toBe('Inactive');
    });
  });

  describe('formatPlanName', () => {
    it('should format plan with nickname', () => {
      const plan: SubscriptionPlan = {
        id: 'plan_test',
        nickname: 'Test Plan',
        amount: 2999,
        interval: 'month'
      };

      expect(formatPlanName(plan)).toBe('Test Plan');
    });

    it('should format plan without nickname', () => {
      const plan: SubscriptionPlan = {
        id: 'plan_test',
        nickname: '',
        amount: 2999,
        interval: 'month'
      };

      expect(formatPlanName(plan)).toBe('$29.99/month');
    });

    it('should handle null plan', () => {
      expect(formatPlanName(null)).toBe('No Plan');
    });
  });

  describe('formatAmount', () => {
    it('should format amounts correctly', () => {
      expect(formatAmount(2999)).toBe('$29.99');
      expect(formatAmount(1000)).toBe('$10.00');
      expect(formatAmount(0)).toBe('$0.00');
      expect(formatAmount(9999)).toBe('$99.99');
    });
  });

  describe('isSubscriptionActive', () => {
    it('should return true for active subscription', () => {
      expect(isSubscriptionActive(mockActiveSubscription)).toBeTrue();
    });

    it('should return false for inactive subscription', () => {
      expect(isSubscriptionActive(mockInactiveSubscription)).toBeFalse();
    });
  });

  describe('canUserGeneratePdf', () => {
    it('should return true for active subscription with remaining PDFs', () => {
      expect(canUserGeneratePdf(mockActiveSubscription)).toBeTrue();
    });

    it('should return true for unlimited subscription', () => {
      expect(canUserGeneratePdf(mockUnlimitedSubscription)).toBeTrue();
    });

    it('should return false for inactive subscription', () => {
      expect(canUserGeneratePdf(mockInactiveSubscription)).toBeFalse();
    });

    it('should return false for active subscription with no remaining PDFs', () => {
      const noRemainingSubscription = {
        ...mockActiveSubscription,
        usage: {
          ...mockActiveSubscription.usage,
          remainingPdfs: 0,
          subscriptionFeatures: {
            ...mockActiveSubscription.usage.subscriptionFeatures,
            unlimitedPdfs: false
          }
        }
      };

      expect(canUserGeneratePdf(noRemainingSubscription)).toBeFalse();
    });
  });

  describe('getNextResetDate', () => {
    it('should return reset date for subscription with reset date', () => {
      const resetDate = getNextResetDate(mockActiveSubscription);
      expect(resetDate).toEqual(new Date('2024-02-01T00:00:00Z'));
    });

    it('should return null for subscription without reset date', () => {
      const resetDate = getNextResetDate(mockInactiveSubscription);
      expect(resetDate).toBeNull();
    });
  });

  describe('getDaysUntilReset', () => {
    beforeEach(() => {
      // Mock current date
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate days until reset correctly', () => {
      const days = getDaysUntilReset(mockActiveSubscription);
      expect(days).toBe(17); // 17 days from Jan 15 to Feb 1
    });

    it('should return null for subscription without reset date', () => {
      const days = getDaysUntilReset(mockInactiveSubscription);
      expect(days).toBeNull();
    });

    it('should return 0 for past reset date', () => {
      const pastResetSubscription = {
        ...mockActiveSubscription,
        usage: {
          ...mockActiveSubscription.usage,
          resetDate: '2024-01-01T00:00:00Z' // Past date
        }
      };

      const days = getDaysUntilReset(pastResetSubscription);
      expect(days).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle subscription with null plan', () => {
      const subscriptionWithNullPlan = {
        ...mockActiveSubscription,
        subscription: {
          ...mockActiveSubscription.subscription,
          plan: null
        }
      };

      const actions = getSubscriptionActions(subscriptionWithNullPlan);
      expect(actions.canUpgrade).toBeFalse();
    });

    it('should handle subscription with missing usage data', () => {
      const subscriptionWithMissingUsage = {
        ...mockActiveSubscription,
        usage: {
          pdfsGenerated: 0,
          lastPdfGeneration: null,
          pdfUsageLimit: 0,
          subscriptionStatus: 'active',
          subscriptionFeatures: {
            pdfGeneration: false,
            unlimitedPdfs: false,
            pdfLimit: 0
          },
          resetDate: null,
          remainingPdfs: 0
        }
      };

      const summary = getUsageSummary(subscriptionWithMissingUsage);
      expect(summary.canGenerate).toBeFalse();
    });

    it('should handle very large amounts in formatAmount', () => {
      expect(formatAmount(999999)).toBe('$9999.99');
      expect(formatAmount(1000000)).toBe('$10000.00');
    });
  });
});
