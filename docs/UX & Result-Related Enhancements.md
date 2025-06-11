UX & Result-Related Enhancements
	1.	Brand-Color Theming on Lookup Screen
	•	Placeholder text is now in electricBlue, guiding the eye to where you start typing.
	•	Input values appear in darkNavy, improving legibility against the background.
	•	Country names in results are highlighted in electricBlue to help you quickly scan and verify your selection.
	2.	Automatic Reciprocal Tariff Exemptions
	•	Instead of forcing users to manually enable exemptions, the system now detects and applies any reciprocal-duty exemptions based on the configured tariff rules—so you instantly see the correct net duty without extra clicks.
	3.	USMCA Origin Support with a Clear Toggle
	•	A dedicated “USMCA Certificate” toggle lets you mark CA/MX goods as origin-verified. When turned on, duty-free rates apply automatically, and the UI clearly shows “USMCA” next to the rate.
	4.	Additive Stacking of Reciprocal Tariffs
	•	All applicable reciprocal duties now sum together instead of one overwriting another. For example, if two reciprocity rules apply (10% + 5%), you’ll see a combined 15% duty, ensuring transparency in how the final rate is calculated.
	5.	Tariff Data Revision 14 Roll-Out
	•	Default global rate updated to 50%, so any items without special rules now default to a clear, uniform duty.
	•	UK special rate remains at 25%, labeled “UK 25%” so it’s never mistaken for the global rate.
	•	Section 232 Steel entries explicitly display “50%, UK 25%” to reflect both the general and country-specific rates side by side.
	•	Extended exemptions are now automatically reflected in results for:
	•	Pharmaceuticals (Ch. 30) from China
	•	Medical devices (HS 9018–9022) from China
	•	Energy products (Ch. 27) from Canada and Mexico

⸻

Technical Fixes & Under-the-Hood Improvements
	1.	Parallel Initialization & Non-blocking Startup
	•	tariffSearchService and TariffService now kick off at the same time, so a slow autocomplete call won’t block your main tariff lookup.
	2.	Reduced Timeouts & Timeout Protections
	•	Search service timeout shortened to 5 seconds to fail fast on network hiccups.
	•	Guards around initialization routines catch slow operations and log them, avoiding silent hangs.
	3.	Resolved Context Hook Error
	•	The app is now wrapped in a top-level <SettingsProvider> so any component using useSettings always has the necessary context.
	4.	Duty Calculation Logic Corrections
	•	Updated the calculateDuty function in useTariff.ts to correctly factor in USMCA origin cases, preventing under- or over-charging.
	5.	Detailed Instrumentation & Logging
	•	Added timing logs around each service startup and search endpoint call—so you’ll see exactly where delays occur in diagnostics.
	6.	Removed Reciprocal-Tariff Toggle
	•	The old “Make Reciprocal Tariffs Additive” switch is gone and the additive logic is now hard-coded, reducing UI clutter and potential user confusion.
	7.	Version-Controlled Tariff Data
	•	Tariff payloads are now delivered as datestamped JSON files, giving you full auditability on which tariff set is in use at any point in time.