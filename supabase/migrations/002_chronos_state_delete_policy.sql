create policy "Users can delete their own chronos_state"
  on public.chronos_state
  for delete
  using (auth.uid() = user_id);
