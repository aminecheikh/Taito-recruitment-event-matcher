/** Hosted copies set DEMO_RESET_ENABLED=false so visitors cannot wipe the shared store. */
export const resetEnabled = (): boolean => process.env.DEMO_RESET_ENABLED !== "false";
