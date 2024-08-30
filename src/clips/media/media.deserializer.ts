/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Timestamp } from "../../models";

type millis = ReturnType<Timestamp['toJSON']>;

export class RangeDeserializer {
  public static fromJSON(obj: [millis, millis]): [Timestamp, Timestamp] {
    return [new Timestamp(obj[0]), new Timestamp(obj[1])]
  }
}
