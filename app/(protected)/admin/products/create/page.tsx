import { Button } from "@/components/ui/button";
import { faker } from "@faker-js/faker";
import FormInput from "@/components/form/FormInput";
import FormContainer from "@/components/form/FormContainer";
import { createProduction } from "@/utils/action";
import PriceInput from "@/components/form/PriceInput";
import ImageInput from "@/components/form/ImageInput";
import TextAreaInput from "@/components/form/TextAreaInput";
import CheckboxInput from "@/components/form/CheckboxInput";
import { SubmitButton } from "@/components/form/Buttons";
import FormSelect from "@/components/form/FormSelect";
import db from "@/utils/db";

async function CreateProductPage() {
  const name = faker.commerce.productName();
  const company = faker.company.name();
  const description = faker.lorem.paragraph({ min: 10, max: 12 });
  const muscles = await db.muscle.findMany();

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-8 capitalize">create product</h1>
      <div className="border border-gray-300 p-8 rounded-md">
        <FormContainer action={createProduction}>
          <div className="grid gap-4 md:grid-cols-2 my-4">
            <FormInput
              type="text"
              name="name"
              label="product name"
              defaultValue={name}
            />
            <FormSelect
              name="category"
              label="Category"
              options={[
                { value: "fitness", label: "Fitness" },
                { value: "recovery", label: "Recovery" },
              ]}
            />

            <FormSelect
              name="muscle"
              label="Target muscle"
              options={[
                { value: "full-body", label: "Full Body" },
                { value: "upper-body", label: "Upper Body" },
                { value: "lower-body", label: "Lower Body" },
                { value: "core", label: "Core" },
                { value: "recovery", label: "Recovery" },
              ]}
            />

            <div>
              <label className="block mb-2 font-medium">Muscle Badges</label>
              <div className="flex flex-wrap gap-4">
                {muscles.map((m) => (
                  <label key={m.id} className="flex items-center gap-2">
                    <input type="checkbox" name="muscleIds" value={m.id} />
                    {m.name}
                  </label>
                ))}
              </div>
            </div>

            <FormInput
              type="text"
              name="company"
              label="company"
              defaultValue={company}
            />
            <PriceInput />
            <ImageInput />
          </div>
          <TextAreaInput
            name="description"
            labelText="product description"
            defaultValue={description}
          />
          <div className="mt-6">
            <CheckboxInput name="featured" label="featured" />
          </div>
          <SubmitButton text="create product" className="mt-8" />
        </FormContainer>
      </div>
    </section>
  );
}

export default CreateProductPage;
