/* eslint-disable @typescript-eslint/unbound-method */
export class StdoutHijacker {
  private originalWrite = process.stdout.write;
  private originalErrorWrite = process.stderr.write;

  /**
   * Temporarily replaces hijacks stdout, then  always restores stdout.write after callback.
   * @param callback
   */
  public hijack(callback: (data: string) => void, restore: boolean = true) {
    const write: any = (data: any) => {
      // Reset stdout
      if (restore) {
        process.stdout.write = this.originalWrite;
        process.stderr.write = this.originalErrorWrite;
      }
      // console.log(data); // Un-comment to show log output
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      callback(data);
    };

    // replace original
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    process.stdout.write = write;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    process.stderr.write = write;
  }

  public restore() {
    // Reset stdout
    process.stdout.write = this.originalWrite;
    process.stderr.write = this.originalErrorWrite;
  }
}
