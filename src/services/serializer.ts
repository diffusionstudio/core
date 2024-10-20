import type { Constructor } from '../types';

export class Serializer {
	/**
	 * Unique identifier of the object
	 */
	public id = crypto.randomUUID();

	toJSON(): any {
		const obj: any = {};
		const properties = (this.constructor as any).__serializableProperties || [];

		properties.forEach(({ propertyKey, serializer }: any) => {
			const value = (this as any)[propertyKey];
			if (serializer && value instanceof serializer) {
				obj[propertyKey] = value.toJSON();
			} else {
				obj[propertyKey] = value;
			}
		});

		return obj;
	}

	static fromJSON<T extends Serializer, K = {}>(this: new () => T, obj: K extends string ? never : K): T {
		const instance = new this();
		const properties = (this as any).__serializableProperties || [];

		properties.forEach(({ propertyKey, serializer }: any) => {
			if ((obj as any).hasOwnProperty(propertyKey)) {
				if (serializer) {
					const nestedInstance = serializer.fromJSON((obj as any)[propertyKey]);
					(instance as any)[propertyKey] = nestedInstance;
				} else {
					(instance as any)[propertyKey] = (obj as any)[propertyKey];
				}
			}
		});

		return instance;
	}
}

export function serializable(serializer?: Omit<Constructor<Serializer>, 'toJSON'>) {
	return function (target: any, propertyKey: string) {
		if (!target.constructor.__serializableProperties) {
			target.constructor.__serializableProperties = [];
		}
		target.constructor.__serializableProperties.push({
			propertyKey,
			serializer,
		});
	};
}
