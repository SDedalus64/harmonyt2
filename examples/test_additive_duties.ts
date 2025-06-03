import { TariffService } from './src/services/tariffService';

async function testAdditiveDuties() {
  const service = TariffService.getInstance();

  try {
    await service.initialize();
    console.log('Tariff service initialized successfully\n');

    const testCases = [
      // Section 232 - Steel (50% to all countries)
      {
        name: 'Steel product from China',
        htsCode: '72022100', // Ferro-silicon
        country: 'CN',
        value: 10000,
        expected: ['Section 232', 'Section 301', 'Reciprocal']
      },
      {
        name: 'Steel product from Canada',
        htsCode: '72022100',
        country: 'CA',
        value: 10000,
        expected: ['Section 232', 'Reciprocal']
      },
      {
        name: 'Steel product from UK',
        htsCode: '72022100',
        country: 'GB',
        value: 10000,
        expected: ['Section 232']
      },

      // Section 232 - Aluminum (50% to all countries)
      {
        name: 'Aluminum product from China',
        htsCode: '76011000', // Aluminum, not alloyed
        country: 'CN',
        value: 10000,
        expected: ['Section 232', 'Reciprocal']
      },
      {
        name: 'Aluminum product from Canada',
        htsCode: '76011000',
        country: 'CA',
        value: 10000,
        expected: ['Section 232', 'Reciprocal']
      },

      // Reciprocal tariffs
      {
        name: 'Non-steel/aluminum from Canada',
        htsCode: '43022060', // Fur skins
        country: 'CA',
        value: 10000,
        expected: ['Reciprocal']
      },
      {
        name: 'Non-steel/aluminum from Mexico',
        htsCode: '43022060',
        country: 'MX',
        value: 10000,
        expected: ['Reciprocal']
      },
      {
        name: 'Non-steel/aluminum from China',
        htsCode: '43022060',
        country: 'CN',
        value: 10000,
        expected: ['Reciprocal']
      },

      // Russia/Belarus - Column 2 (NTR suspended)
      {
        name: 'Product from Russia',
        htsCode: '43022060',
        country: 'RU',
        value: 10000,
        expected: ['Column 2']
      },
      {
        name: 'Product from Belarus',
        htsCode: '43022060',
        country: 'BY',
        value: 10000,
        expected: ['Column 2']
      },

      // Regular countries (no special duties)
      {
        name: 'Product from UK',
        htsCode: '43022060',
        country: 'GB',
        value: 10000,
        expected: ['MFN']
      },
      {
        name: 'Product from Japan (FTA)',
        htsCode: '43022060',
        country: 'JP',
        value: 10000,
        expected: ['FTA']
      }
    ];

    console.log('Testing various additive duty scenarios:\n');
    console.log('='.repeat(80));

    for (const testCase of testCases) {
      console.log(`\nTest: ${testCase.name}`);
      console.log(`HTS: ${testCase.htsCode}, Country: ${testCase.country}, Value: $${testCase.value}`);
      console.log('-'.repeat(60));

      const result = service.calculateDuty(testCase.htsCode, testCase.value, testCase.country);

      // Display components
      console.log('Duty Components:');
      for (const component of result.components) {
        console.log(`  - ${component.label}: ${component.rate}% = $${component.amount.toFixed(2)}`);
      }

      console.log(`\nTotal Rate: ${result.totalRate}%`);
      console.log(`Duty Only: $${result.dutyOnly.toFixed(2)}`);
      console.log(`Total with Fees: $${result.amount.toFixed(2)}`);

      // Verify expected components
      const componentTypes = result.components.map(c => c.type);
      const hasExpectedComponents = testCase.expected.every(exp =>
        componentTypes.some(type => type.toLowerCase().includes(exp.toLowerCase()))
      );

      if (hasExpectedComponents) {
        console.log('✅ All expected duty types found');
      } else {
        console.log('❌ Missing expected duty types');
        console.log('Expected:', testCase.expected);
        console.log('Found:', componentTypes);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\nSpecial Duty Summary:');
    console.log('- Section 232 (Steel/Aluminum): 50% to ALL countries');
    console.log('- Section 301 (China): 7.5-25% on specific products');
    console.log('- Reciprocal Tariffs:');
    console.log('  - China: 30% (temporary, expires Aug 12, 2025)');
    console.log('  - Canada: 25% (USMCA goods exempt)');
    console.log('  - Mexico: 25% (USMCA goods exempt)');
    console.log('- Column 2 (NTR Suspended): Russia & Belarus');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testAdditiveDuties();
